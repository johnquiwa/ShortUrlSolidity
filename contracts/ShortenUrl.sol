pragma solidity ^0.4.24;

contract ShortenUrl {
    address owner;
    mapping (bytes8 => bytes) urlMatcher;

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier isNotInMatcher(bytes8 shortUrl) {
        require(urlMatcher[shortUrl].length == 0);
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function createShortenedUrl(bytes8 shortenedUrl, bytes originalUrl)
    isOwner
    isNotInMatcher(shortenedUrl)
    public
    {
        urlMatcher[shortenedUrl] = originalUrl;
    }

    function getMatchedUrl(bytes8 shortenedUrl)
    isOwner
    public
    view
    returns(bytes)
    {
        return urlMatcher[shortenedUrl];
    }
}