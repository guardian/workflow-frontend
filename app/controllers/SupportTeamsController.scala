package controllers

import com.gu.workflow.util.Dynamo
import model.{Staff, SupportTeam}
import play.api.mvc.{Controller}

import scala.collection.JavaConversions._

object SupportTeamsController extends Controller with PanDomainAuthActions with Dynamo {

  def createNewStaff(name: String, team: String) = {
    supportStaff.putItem(Staff(name, false, team).toItem)
  }

  def getStaff(): List[Staff] = {
    supportStaff.scan().map(Staff.fromItem).toList
  }

  def getTeams():List[SupportTeam] = {
    getStaff().groupBy(_.team).map(x => SupportTeam(x._1, x._2)).toList
  }

}