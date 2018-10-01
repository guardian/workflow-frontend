package com.gu.workflow.util

import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, EnvironmentVariableCredentialsProvider, InstanceProfileCredentialsProvider}
import com.amazonaws.client.builder.AwsClientBuilder.EndpointConfiguration
import com.amazonaws.regions.Regions
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder
import com.amazonaws.services.dynamodbv2.document.DynamoDB
import com.amazonaws.services.ec2.AmazonEC2ClientBuilder
import com.amazonaws.services.ec2.model.{DescribeTagsRequest, Filter}
import com.amazonaws.util.EC2MetadataUtils

import scala.collection.JavaConverters._

object AWS {

  lazy val region: Regions = Regions.EU_WEST_1

  lazy val EC2Client = AmazonEC2ClientBuilder.standard.withRegion(region).build
  lazy val DynamoDb = AmazonDynamoDBClientBuilder.standard().withCredentials(credentialsProvider)
    .withEndpointConfiguration(new EndpointConfiguration("localstack:4569", "eu-west-1")).build()

  lazy val credentialsProvider = new AWSCredentialsProviderChain(
    new EnvironmentVariableCredentialsProvider(),
    InstanceProfileCredentialsProvider.getInstance(),
    new ProfileCredentialsProvider("workflow"),
    new DefaultAWSCredentialsProviderChain
  )
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
