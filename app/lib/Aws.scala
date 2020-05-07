package lib

import com.amazonaws.auth.{AWSCredentialsProvider, AWSCredentialsProviderChain, EnvironmentVariableCredentialsProvider, InstanceProfileCredentialsProvider}
import com.amazonaws.auth.profile.ProfileCredentialsProvider

object Aws {
  val region = "eu-west-1"

  def credentialsProvider: AWSCredentialsProvider = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider("workflow"),
    InstanceProfileCredentialsProvider.getInstance(),
    new EnvironmentVariableCredentialsProvider()
  )
}
