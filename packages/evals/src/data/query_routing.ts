import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const QUERY_ROUTING_DATA: Record<string, any> = {
  inputs: {
    messages: [
      new HumanMessage(
        "generate code for an LLM agent that can scrape the web"
      ),
      new AIMessage(
        "I've crafted a web scraper for you that fetches and parses content from a specified URL. Let me know if you need any modifications or additional features!"
      ),
      new HumanMessage("Where's the LLM?"),
    ],
    artifact: {
      currentIndex: 1,
      contents: [
        {
          index: 1,
          type: "code" as const,
          title: "Web Scraper LLM Agent",
          code: "import requests\nfrom bs4 import BeautifulSoup\n\nclass WebScraper:\n    def __init__(self, url):\n        self.url = url\n        self.content = None\n\n    def fetch_content(self):\n        try:\n            response = requests.get(self.url)\n            response.raise_for_status()  # Check for HTTP errors\n            self.content = response.text\n        except requests.RequestException as e:\n            print(f\"Error fetching {self.url}: {e}\")\n\n    def parse_content(self):\n        if self.content:\n            soup = BeautifulSoup(self.content, 'html.parser')\n            return soup\n        else:\n            print(\"No content to parse. Please fetch content first.\")\n            return None\n\n    def scrape(self):\n        self.fetch_content()\n        return self.parse_content()\n\n# Example usage:\nif __name__ == '__main__':\n    url = 'https://example.com'\n    scraper = WebScraper(url)\n    parsed_content = scraper.scrape()\n    print(parsed_content)",
          language: "python" as const,
        },
      ],
    },
  },
  referenceOutputs: {
    next: "rewriteArtifact",
  },
};
