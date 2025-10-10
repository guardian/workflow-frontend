package com.gu.workflow.util

import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain}
import com.amazonaws.services.dynamodbv2.document.DynamoDB
import com.amazonaws.services.dynamodbv2.{AmazonDynamoDB, AmazonDynamoDBClientBuilder}
import com.amazonaws.services.ec2.model.{DescribeTagsRequest, Filter}
import com.amazonaws.services.ec2.{AmazonEC2, AmazonEC2ClientBuilder}
import com.amazonaws.util.EC2MetadataUtils
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.services.s3.S3Client

import scala.jdk.CollectionConverters._

object AWS {
  import com.amazonaws.regions.{Region, Regions}

  lazy val credentialsProvider = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider("workflow"),
    new DefaultAWSCredentialsProviderChain()
  )

  lazy val region: Region = Region getRegion Regions.EU_WEST_1

  lazy val EC2Client: AmazonEC2 = {
    AmazonEC2ClientBuilder
      .standard
      .withCredentials(credentialsProvider)
      .withRegion(region.getName)
      .build
  }

  lazy val DynamoDb: AmazonDynamoDB = {
    AmazonDynamoDBClientBuilder
      .standard
      .withCredentials(credentialsProvider)
      .withRegion(region.getName)
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
  lazy val dynamoDb = new DynamoDB(AWS.DynamoDb)
}

trait AwsInstanceTags {
  lazy val instanceId = Option(EC2MetadataUtils.getInstanceId)

  def readTag(tagName: String): Option[String] = {
    instanceId.flatMap { id =>
      val tagsResult = AWS.EC2Client.describeTags(
        new DescribeTagsRequest().withFilters(
          new Filter("resource-type").withValues("instance"),
          new Filter("resource-id").withValues(id),
          new Filter("key").withValues(tagName)
        )
      )
      tagsResult.getTags.asScala.find(_.getKey == tagName).map(_.getValue)
    }
  }
}
