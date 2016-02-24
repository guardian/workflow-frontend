package test

import models.{Section, ContentItem, Status, Stub}
import org.joda.time.DateTime
import org.scalactic.Equality
import play.api.libs.json._
import org.scalatest._
import com.gu.workflow.test.lib.TestData._

class WorkflowSpec extends FreeSpec  with  WorkflowIntegrationSuite with Inside {

  s"$host/api/content" - {
    "show content in db" in {
      val expectedTitle = "Content Item"
      val content = createContent(contentItem(defaultStub(title=expectedTitle)))

      val js: JsValue = getJs("api/content")

      val actualTitle = ((js \ "stubs").apply(0) \ "title").validate[String].asOpt.get

      expectedTitle should equal(actualTitle)
    }
  }

  s"$host/api/content?text=query" - {
    "show filter results from api" in {
      createContent(contentItem(defaultStub(title="Foo")))
      createContent(contentItem(defaultStub(title="Bar")))

      val includedStubs = (getJs(s"api/content?text=Foo") \ "stubs").as[JsArray]
      val excludedStubs = (getJs(s"api/content?text=Bar") \ "stubs").as[JsArray]

      includedStubs.productArity should equal(1)
      excludedStubs.productArity should equal(1)

      val includedTitle = (includedStubs.apply(0) \ "title").validate[String].asOpt.get
      val excludedTitle = (excludedStubs.apply(0) \ "title").validate[String].asOpt.get

      includedTitle should equal("Foo")
      excludedTitle should equal("Bar")
    }
  }

  def createContentItemJson(c: ContentItem, section: Section): JsValue = {
    Json.toJson(c).as[JsObject] ++ Json.obj("section" -> Json.toJson(section).as[JsObject])
  }

  s"$host/api/stubs" - {
    "create a stub" in {
      val stubJson = createContentItemJson(randomStub, generateSection)
      val res = postJS(s"api/stubs", stubJson)
      val id = (res \ "data" \ "stubId").validate[Long]
      id.isSuccess should be (true)
    }

    "create a stub and workflow content" - {
      val ci = randomStubAndWC
      val contentJson = createContentItemJson(ci, generateSection)
      val res = postJS(s"api/stubs", contentJson)
      val id = (res \ "data" \ "stubId").validate[Long]
      val composerId = (res \ "data" \ "composerId").validate[Option[String]]
      id.isSuccess should be (true)
      composerId.fold(_ => fail("composerId should be defined"), cId =>
        cId should equal (ci.wcOpt.map(_.composerId))
      )
    }

    "should fail if stubId defines a composerId and workflow content is not defined" in {
      val stubWithComposerId = ContentItem(randomStub.stub.copy(composerId=Some("composerId")), None)
      val stubJson = createContentItemJson(stubWithComposerId, generateSection)
      val res = postJS(s"api/stubs", stubJson, 400)
      val errorMessage = (res \ "error" \ "message").validate[String]
      errorMessage.fold(_ => fail("error message should be defined"), message =>
        message should equal ("JsonParseError")
      )
    }
  }




}
