package com.gu.workflow.lib

import java.net.URI
import software.amazon.awssdk.auth.credentials.{AwsCredentialsProviderChain, ProfileCredentialsProvider}
import software.amazon.awssdk.services.sts.auth.StsAssumeRoleCredentialsProvider
import com.github.blemale.scaffeine.{AsyncLoadingCache, Scaffeine}
import com.gu.contentapi.client.IAMSigner
import com.gu.workflow.api.{ApiUtils, WSUtils}
import com.gu.workflow.util.AWS
import io.circe.parser
import play.api.Logging
import play.api.libs.ws.{WSClient, WSResponse}
import software.amazon.awssdk.services.sts.model.AssumeRoleRequest

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

class ContentAPI(
  capiPreviewRole: String,
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils with WSUtils with Logging {

  private val previewSigner = {
    val capiPreviewCredentials = AwsCredentialsProviderChain.of(
      ProfileCredentialsProvider.builder.profileName("capi").build,
      StsAssumeRoleCredentialsProvider.builder
        .stsClient(AWS.STSClient)
        .refreshRequest(
          AssumeRoleRequest.builder
            .roleArn(capiPreviewRole)
            .roleSessionName("capi")
            .build
        ).build
    )

    new IAMSigner(
      credentialsProvider = capiPreviewCredentials,
      awsRegion = AWS.region.toString
    )
  }

  private def getHeaders(path: String, params: List[(String, String)]): List[(String, String)] = {
    val qs = params.map{case (a,b) => s"$a=$b"}.mkString("&")
    val url = s"$apiRoot/$path?$qs"
    previewSigner.addIAMHeaders(Map.empty, URI.create(url)).toList
  }

  def getPreview(path: String, params: List[(String, String)]): Future[WSResponse] = {
    val headers = getHeaders(path, params)
    getRequest(path, params, headers)
  }

  private val tagCache: AsyncLoadingCache[Long, Option[String]] = {
    Scaffeine()
      .expireAfterWrite(1.hour)
      .maximumSize(500)
      .buildAsyncFuture[Long, Option[String]](getTagInternalNameUnderlying)
  }

  def getTagInternalName(tagId: Long)(implicit ec: ExecutionContext): Future[Option[String]] =
    tagCache.get(tagId)

  private def getTagInternalNameUnderlying(tagId: Long): Future[Option[String]] = {
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
              .toOption
              .get
        case Left(e) =>
          logger.warn("Unable to communicate with CAPI", e)
          Some("Print location unavailable")
      }
  }

}
