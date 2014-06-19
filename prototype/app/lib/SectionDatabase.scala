package lib

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import akka.agent.Agent
import models.Section
import play.api.libs.json.JsArray
import play.api.libs.ws.WS


object SectionDatabase {
  val store: Agent[Set[Section]] = Agent(Set())

  for(apiSections <- loadSectionsFromApi) store.alter(apiSections + Section("Dev"))

  def upsert(section: Section): Future[Set[Section]] = store.alter(_ + section)
  def remove(section: Section): Future[Set[Section]] = store.alter(_ - section)

  def sectionList: Future[List[Section]] = Future { store.get().toList.sortBy(_.name) }

  // TODO sw 02/05/2014 this a dev bootstrap, remove in favor of persisted list once we've got a persistence mechanism
  private def loadSectionsFromApi = {
    val sectionUrl = "http://content.guardianapis.com/sections.json"
    WS.url(sectionUrl).get().map { resp =>
      val titles = resp.json \ "response" \ "results" match {
        case JsArray(sections) => sections.map{ s => (s \ "webTitle").as[String] }
        case _ => Nil
      }
      titles.map(Section(_)).toSet
    }

  }

}
