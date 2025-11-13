package com.gu.workflow.util

import software.amazon.awssdk.auth.credentials.{AwsCredentialsProviderChain, DefaultCredentialsProvider, ProfileCredentialsProvider}
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient
import software.amazon.awssdk.imds.Ec2MetadataClient
import software.amazon.awssdk.services.ec2.Ec2Client
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.ec2.model.{DescribeTagsRequest, Filter}
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.sts.StsClient

import scala.jdk.CollectionConverters._
import scala.util.Try

object AWS {
  lazy val credentialsProvider = AwsCredentialsProviderChain.of(
    ProfileCredentialsProvider.builder.profileName("workflow").build,
    DefaultCredentialsProvider.builder.build
  )

  lazy val region: Region = Region.EU_WEST_1

  lazy val STSClient: StsClient = {
    StsClient.builder()
      .credentialsProvider(credentialsProvider)
      .region(region)
      .build
  }

  lazy val EC2Client: Ec2Client = {
    Ec2Client.builder()
      .credentialsProvider(credentialsProvider)
      .region(region)
      .build
  }

  lazy val DynamoDb: DynamoDbClient = {
    DynamoDbClient
      .builder
      .credentialsProvider(credentialsProvider)
      .region(region)
      .build
  }
}

object AWSv2 {
  import software.amazon.awssdk.regions.Region

  lazy val credentialsProvider = DefaultCredentialsProvider.builder().profileName("workflow").build()

  lazy val region = Region.EU_WEST_1

  lazy val s3 = S3Client.builder().credentialsProvider(credentialsProvider).region(region).build()
}

trait Dynamo {
  lazy val dynamoDb = DynamoDbEnhancedClient.builder.dynamoDbClient(AWS.DynamoDb).build
}

trait AwsInstanceTags {
  lazy val instanceId = Try(Ec2MetadataClient.create.get("instanceId").asString).toOption

  def readTag(tagName: String): Option[String] = {
    instanceId.flatMap { id =>
      val tagsResult = AWS.EC2Client.describeTags(
        DescribeTagsRequest.builder().filters(
          Filter.builder.name("resource-type").values("instance").build,
          Filter.builder.name("resource-id").values(id).build,
          Filter.builder.name("key").values(tagName).build,
        ).build
      )
      tagsResult.tags.asScala.find(_.key == tagName).map(_.value)
    }
  }
}
