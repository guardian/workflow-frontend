export type ContentType =
  | "article"
  | "liveblog"
  | "gallery"
  | "interactive"
  | "picture"
  | "video"
  | "audio";

export type Stub = {
  contentType: ContentType;
  commissionedLength?: number;
};

/*
TO DO - model the rest of the Stub
{
    "articleFormat": "Standard Article",
    "contentType": "article",
    "section": {
        "name": "Cities",
        "selected": false,
        "id": 1,
        "$$hashKey": "object:59"
    },
    "priority": 0,
    "needsLegal": "NA",
    "needsPictureDesk": "NA",
    "prodOffice": "UK",
    "status": "Writers",
    "title": "for",
    "template": {
        "id": "Comments test_2015-04-17T15:10:53.356",
        "display": "Comments test - 17th April 2015",
        "$$hashKey": "object:1736"
    },
    "due": "2024-10-08T00:05:00.000Z"
}

*/