import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";
import { CONTEXT_DOCUMENTS_NAMESPACE } from "@opencanvas/shared/constants";
import { createClient, UserResponse } from "@supabase/supabase-js";

const USER_PERMISSIONS = [
  "threads:create",
  "threads:read",
  "threads:update",
  "threads:delete",
  "threads:search",
  "threads:create_run",
  "assistants:create",
  "assistants:read",
  "assistants:update",
  "assistants:delete",
  "assistants:search",
  "assistants:write",
  "store:put",
  "store:get",
  "store:search",
  "store:list_namespaces",
  "store:delete",
];

const ADMIN_PERMISSIONS = [
  ...USER_PERMISSIONS,
  "crons:create",
  "crons:read",
  "crons:update",
  "crons:delete",
  "crons:search",
];

const apiKeyMatch = (apiKey: string) => {
  return apiKey === process.env.LANGCHAIN_API_KEY;
};

const isContextDocumentNamespace = (namespace: string[]): boolean => {
  return namespace.includes(CONTEXT_DOCUMENTS_NAMESPACE[0]);
};

export const auth = new Auth()
  .authenticate(async (request) => {
    const authorization = request.headers.get("Authorization");
    const apiKey = request.headers.get("X-API-KEY");
    if (apiKey && apiKeyMatch(apiKey)) {
      return {
        is_authenticated: true,
        display_name: "ADMIN",
        identity: "ADMIN",
        permissions: ADMIN_PERMISSIONS,
        role: "admin",
      };
    }

    const exc = new HTTPException(401, {
      message: "Could not validate credentials",
      headers: { "WWW-Authenticate": "Bearer" },
    });

    if (!authorization?.toLocaleLowerCase().startsWith("bearer ")) {
      console.log("authorization could not verify", authorization);
      throw exc;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !supabaseKey) {
      throw new HTTPException(555, {
        message:
          "SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables are not set",
      });
    }
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    let authRes: UserResponse | undefined;

    try {
      authRes = await supabaseClient.auth.getUser(authorization?.split(" ")[1]);
    } catch (error) {
      throw new HTTPException(401, {
        message: "Failed to verify JWT token",
        cause: error,
      });
    }

    if (!authRes.data.user) throw exc;

    const user = authRes.data.user;
    if (!user) throw exc;

    return {
      permissions: USER_PERMISSIONS,
      is_authenticated: true,
      display_name: user.user_metadata.display_name,
      identity: user.id,
      role: "user",
    };
  })
  .on("*", ({ permissions, user }) => {
    if (user.role === "admin") {
      return;
    }

    if (!permissions?.length) {
      throw new HTTPException(403, { message: "Not authorized" });
    }
  })
  .on("assistants:create", ({ value, user, permissions }) => {
    if (user.role === "admin") {
      return;
    }

    if (!permissions?.includes("assistants:write")) {
      throw new HTTPException(403, { message: "Not authorized" });
    }

    value.metadata ??= {};
    value.metadata["user_id"] = user.identity;
  })
  .on("assistants:search", ({ user }) => {
    if (user.role === "admin") {
      return;
    }

    return { user_id: user.identity };
  })
  .on(["threads", "assistants"], ({ action, value, user }) => {
    if (user.role === "admin") {
      return;
    }

    const filters = { user_id: user.identity };
    if (
      action === "threads:create_run" ||
      action === "threads:update" ||
      action === "threads:create" ||
      action === "assistants:create" ||
      action === "assistants:update"
    ) {
      value.metadata ??= {};
      value.metadata["user_id"] = user.identity;
    }
    return filters;
  })
  .on("store", ({ value, user }) => {
    if (user.role === "admin") {
      return;
    }

    const identity = user.identity;
    // Throw an error if their identity is undefined, or if the namespace does not include their identity and is not a context document namespace
    // this is due to the legacy namespacing of the context documents which do not include the user identity
    if (
      !identity ||
      (!value.namespace?.includes(identity) &&
        !isContextDocumentNamespace(value.namespace ?? []))
    ) {
      throw new HTTPException(403, { message: "Not authorized" });
    }
  });
