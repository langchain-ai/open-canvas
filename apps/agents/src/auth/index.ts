import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";
import { CONTEXT_DOCUMENTS_NAMESPACE } from "@opencanvas/shared/constants";
import { createClient, UserResponse } from "@supabase/supabase-js";

const SECRET_KEY = process.env.AUTH_SECRET_KEY;

const isContextDocumentNamespace = (namespace: string[]): boolean => {
  return namespace.includes(CONTEXT_DOCUMENTS_NAMESPACE[0]);
};

export const auth = new Auth()
  .authenticate(async (request) => {
    if (!SECRET_KEY) {
      throw new HTTPException(500, {
        message: "AUTH_SECRET_KEY environment variable is not set",
      });
    }
    const authorization = request.headers.get("Authorization");

    const exc = new HTTPException(401, {
      message: "Could not validate credentials",
      headers: { "WWW-Authenticate": "Bearer" },
    });

    if (!authorization?.toLocaleLowerCase().startsWith("bearer ")) {
      throw exc;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !supabaseKey) {
      console.log("SENDING 500");
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

    const permissions = [
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
      "store:put",
      "store:get",
      "store:search",
      "store:list_namespaces",
      "store:delete",
    ];

    return {
      permissions,
      is_authenticated: true,
      display_name: user.user_metadata.display_name,
      identity: user.id,
    };
  })
  .on("*", ({ permissions }) => {
    if (!permissions?.length) {
      throw new HTTPException(403, { message: "Not authorized" });
    }
  })
  .on("assistants:create", ({ value, user, permissions }) => {
    if (!permissions?.includes("assistants:write")) {
      throw new HTTPException(403, { message: "Not authorized" });
    }

    value.metadata ??= {};
    value.metadata["user_id"] = user.identity;
  })
  .on("assistants:search", (params) => ({ user_id: params.user.identity }))
  .on(["threads", "assistants"], ({ action, value, user }) => {
    const filters = { supabase_user_id: user.identity };
    if (
      action === "threads:create_run" ||
      action === "threads:update" ||
      action === "threads:create" ||
      action === "assistants:create" ||
      action === "assistants:update"
    ) {
      value.metadata ??= {};
      value.metadata["supabase_user_id"] = user.identity;
    }
    return filters;
  })
  .on("store", ({ value, user }) => {
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
