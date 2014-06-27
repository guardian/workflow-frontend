package lib

import com.gu.workflow.lib.Config
import play.Logger

case class ProleConfiguration(awsKey: String, awsSecret: String, flexNotificationsQ: String)

object ProleConfiguration {
  def apply: ProleConfiguration = {
    val configEit = (for {
      awsKey <- Config.getConfigString("aws.key").right
      awsSecret <- Config.getConfigString("aws.secret").right
      flexNotificationsQ <- Config.getConfigString("aws.flex.notifications.queue").right
    } yield ProleConfiguration(awsKey, awsSecret, flexNotificationsQ))
    configEit.fold(error => {
      Logger.error(s"could not instantiate Prole Configuration ${error}")
      sys.error(error)
    }, config => config)
  }
}
