package com.gu.workflow.lib

import lib._
import org.scalatest.{Matchers, FreeSpec}


class DBToAPIResponseTest  extends FreeSpec with Matchers {
  "updateRes" - {
    "should return not found error if returned row is 0" in {
      DBToAPIResponse.updateRes(3L, 0).fold(apiError => {
        apiError.message should equal("UpdateError")
        apiError.statusCode should equal(404)
      },
        r => fail(s"expected left got ${r}")
      )
    }
    "should return success if row is not 0" in {
      DBToAPIResponse.updateRes(3L, 1).fold(apiError =>
        fail(s"expected right got ${apiError}"),
        r => r.data should equal (3L)
      )
    }
  }

  "upsertContentResponse" - {
    "should return a status code of 500 if it receives a database error" in {
      DBToAPIResponse.upsertContentResponse(Left(DatabaseError("exception"))).fold(apiError => {
        apiError.message should equal("DatabaseError")
        apiError.friendlyMessage should equal ("exception")
        apiError.statusCode should equal (500)
      }, r => fail(s"expected left got ${r}"))
    }

    "should return a status code of 409 if composerIds are not equal" in {
      DBToAPIResponse.upsertContentResponse(Left(ComposerIdsConflict(Some("1"), Some("2")))).fold(apiError => {
        apiError.statusCode should equal (409)
      }, r => fail(s"expected left got ${r}"))
    }

    "should return a status code of 409 if composerId exists in the content table" in {
      DBToAPIResponse.upsertContentResponse(Left(ContentItemExists)).fold(apiError => {
        apiError.statusCode should equal (409)
      }, r => fail(s"expected left got ${r}"))
    }

    "should return a 404 is stub row is not found" in {
      DBToAPIResponse.upsertContentResponse(Left(StubNotFound(3L))).fold(apiError => {
        apiError.statusCode should equal (404)
      }, r => fail(s"expected left got ${r}"))
    }


    "should return a 200 if content is successfully upserted" in {
      DBToAPIResponse.upsertContentResponse(Right(ContentUpdate(1L, Some("id")))).fold(apiError => {
        fail(s"expected right got left ${apiError}")
      }, r => {
        r.statusCode should equal (200)
        r.data.stubId should equal (1L)
        r.data.composerId should equal (Some("id"))
      })
    }
  }

  "deleteResponse" - {
    "should return a 404 is response if delete operation is none" in {
      DBToAPIResponse.deleteResponse(4L, None).fold(apiError => {
         apiError.statusCode should equal (404)
      }, r => fail(s"expected left got r ${r}"))
    }
    "should return a 200 response if delete operation is defined" in {
      DBToAPIResponse.deleteResponse(4L, Some(DeleteOp(4L, 0))).fold(apiError => {
        fail(s"expected right got left ${apiError}")
      }, r => {
        r.statusCode should equal (200)
      })
    }

  }

}
