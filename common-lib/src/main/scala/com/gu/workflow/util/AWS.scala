package com.gu.workflow.util

import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, EnvironmentVariableCredentialsProvider, InstanceProfileCredentialsProvider}
import com.amazonaws.regions.{Region, Regions}
import com.amazonaws.services.cloudwatch.{AmazonCloudWatchAsyncClient, AmazonCloudWatchAsyncClientBuilder}
import com.amazonaws.services.dynamodbv2.{AmazonDynamoDBClient, AmazonDynamoDBClientBuilder}
import com.amazonaws.services.dynamodbv2.document.DynamoDB
import com.amazonaws.services.ec2.{AmazonEC2Client, AmazonEC2ClientBuilder}
import com.amazonaws.services.ec2.model.{DescribeTagsRequest, Filter}
import com.amazonaws.util.EC2MetadataUtils

import scala.collection.JavaConverters._

object AWS {

  lazy val region: Region = Region getRegion Regions.EU_WEST_1

  lazy val EC2Client = AmazonEC2ClientBuilder.standard.withRegion(region.getName).build
  lazy val CloudWatch = AmazonCloudWatchAsyncClientBuilder.standard.withRegion(region.getName).build
  lazy val DynamoDb = AmazonDynamoDBClientBuilder.standard.withRegion(region.getName).withCredentials(
    new AWSCredentialsProviderChain(
      new EnvironmentVariableCredentialsProvider(),
      InstanceProfileCredentialsProvider.getInstance(),
      new ProfileCredentialsProvider("workflow"),
      new DefaultAWSCredentialsProviderChain
    )
  ).build
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
