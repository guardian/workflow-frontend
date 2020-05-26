package com.gu.workflow.lib

import java.net.URI

import com.amazonaws.auth.{AWSCredentialsProviderChain, STSAssumeRoleSessionCredentialsProvider}
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.gu.contentapi.client.IAMSigner
import play.api.Logger
import com.gu.workflow.util.AWS
import io.circe.parser
import play.api.Application
import play.api.libs.ws.{WS, WSResponse}

import scala.concurrent.{ExecutionContext, Future}

class ContentAPI(capiPreviewRole: String, capiPreviewIamUrl: String) {

  private val previewSigner = {
    val capiPreviewCredentials = new AWSCredentialsProviderChain(
      new ProfileCredentialsProvider("capi"),
      new STSAssumeRoleSessionCredentialsProvider.Builder(capiPreviewRole, "capi").build()
    )

    new IAMSigner(
      credentialsProvider = capiPreviewCredentials,
      awsRegion = AWS.region.getName
    )
  }

  def getPreview(path: String, request: String)(implicit app:Application): Future[WSResponse] = {
    val url = s"$capiPreviewIamUrl/$path?$request"
    val headers = previewSigner.addIAMHeaders(Map.empty, URI.create(url))
    WS.url(url)
      .withHeaders(headers.toSeq: _*)
      .get()
  }

  import play.api.Play.current
  def getTagInternalName(tagId: Long)(implicit ec: ExecutionContext): Future[Option[String]] = {
    val path = s"internal-code/tag/$tagId"
    val request = "page-size=0"
    val url = s"$capiPreviewIamUrl/$path?$request"
    val headers = previewSigner.addIAMHeaders(Map.empty, URI.create(url))
    WS.url(url)
      .withHeaders(headers.toSeq: _*)
      .get()
      .map(response => parser.parse(response.body))
      .map {
        case Right(a) => {
          a.hcursor
            .downField("response")
            .downField("tag")
            .downField("internalName")
              .as[Option[String]]
              .right
              .get
        }
        case Left(e) =>
          Logger.warn("Unable to communicate with CAPI", e)
          None
      }
  }

}
