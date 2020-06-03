package com.gu.workflow.lib

import java.net.URI

import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, STSAssumeRoleSessionCredentialsProvider}
import com.gu.contentapi.client.IAMSigner
import com.gu.workflow.api.ApiUtils
import com.gu.workflow.util.AWS
import io.circe.parser
import play.api.{Application, Logger, Logging}
import play.api.libs.ws.{WSClient, WSResponse}
import scalacache.memoization._

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

class ContentAPI(
  capiPreviewRole: String,
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils with Caching with Logging {

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

  private def getHeaders(path: String, params: List[(String, String)]): List[(String, String)] = {
    val qs = params.map{case (a,b) => s"$a=$b"}.mkString("&")
    val url = s"$apiRoot/$path?$qs"
    previewSigner.addIAMHeaders(Map.empty, URI.create(url)).toList
  }

  def getPreview(path: String, params: List[(String, String)])(implicit app:Application): Future[WSResponse] = {
    val headers = getHeaders(path, params)
    getRequest(path, params, headers)
  }

  def getTagInternalName(tagId: Long)(implicit ec: ExecutionContext): Future[Option[String]] = memoize(60.minutes) {
    val path = s"internal-code/tag/$tagId"
    val params = List(("page-size", "0"))
    val headers = getHeaders(path, params)

    getRequest(path, params, headers)
      .map(response => parser.parse(response.body))
      .map {
        case Right(a) =>
          a.hcursor
            .downField("response")
            .downField("tag")
            .downField("internalName")
              .as[Option[String]]
              .right
              .get
        case Left(e) =>
          logger.warn("Unable to communicate with CAPI", e)
          Some("Print location unavailable")
      }
  }

}
