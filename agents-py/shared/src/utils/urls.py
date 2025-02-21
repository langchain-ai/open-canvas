import re
from typing import List, Set

def extract_urls(text: str) -> List[str]:
    """
    Extracts all URLs from a given string.
    
    Args:
        text: The string to extract URLs from
        
    Returns:
        List of URLs found in the text
    """
    markdown_link_regex = r'\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)'
    urls: Set[str] = set()
    
    # First replace all markdown links with spaces to avoid double-matching
    def replace_with_spaces(match: re.Match) -> str:
        url = match.group(2)
        urls.add(url)
        return ' ' * len(match.group(0))  # Replace with spaces to preserve string length
    
    processed_text = re.sub(markdown_link_regex, replace_with_spaces, text)
    
    # Then look for any remaining plain URLs in the text
    plain_url_regex = r'https?:\/\/[^\s<\]]+(?:[^<.,:;"\']\]\s)]|(?=\s|$))'
    plain_urls = re.findall(plain_url_regex, processed_text)
    urls.update(plain_urls)
    
    return list(urls) 