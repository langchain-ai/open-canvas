export class MockChatModel {
  async invoke(input: any): Promise<any> {
    return {
      content: "Mock response from chat model",
      additional_kwargs: {},
    };
  }

  async astream(input: any): Promise<any> {
    return {
      content: "Mock response from chat model",
      additional_kwargs: {},
    };
  }
}