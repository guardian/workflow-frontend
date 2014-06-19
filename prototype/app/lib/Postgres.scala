package lib

import models.{WorkflowContent, Stub, Status, Section}
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time.DateTime
import scala.slick.driver.PostgresDriver.simple._
import com.gu.workflow.db.Schema._
import com.gu.workflow.syntax._
import models.DashboardRow

object Postgres {

  import play.api.Play.current
  import play.api.db.slick.DB

  def getContent(
                  section:  Option[Section] = None,
                  dueFrom:  Option[DateTime] = None,
                  dueUntil: Option[DateTime] = None,
                  status:   Option[Status] = None,
                  contentType: Option[String] = None,
                  published: Option[Boolean] = None
                  ): List[DashboardRow] =
    DB.withTransaction { implicit session =>
      val stubsQuery =
        stubs |>
          dueFrom.foldl[StubQuery]  ((q, dueFrom)  => q.filter(_.due >= dueFrom)) |>
          dueUntil.foldl[StubQuery] ((q, dueUntil) => q.filter(_.due < dueUntil)) |>
          section.foldl[StubQuery]  { case (q, Section(s))  => q.filter(_.section === s) }

      val contentQuery =
        content |>
          status.foldl[ContentQuery] { case (q, Status(s)) => q.filter(_.status === s) } |>
          contentType.foldl[ContentQuery] ((q, contentType) => q.filter(_.contentType === contentType)) |>
          published.foldl[ContentQuery] ((q, published) => q.filter(_.published === published))

      val query = for {
        s <- stubsQuery
        c <- contentQuery if s.composerId === c.composerId
      } yield (s, c)

      query.sortBy { case (s, c) => s.due }.list.map {
        case ((pk, title, section, due, assignee, cId, stubContentType),
        (composerId, path, lastMod, lastModBy, status, contentType, commentable, headline, published)) =>
          DashboardRow(
            Stub(Some(pk), title, section, due, assignee, cId, stubContentType),
            WorkflowContent(
              composerId,
              path,
              headline,
              contentType,
              Some(Section(section)),
              Status(status),
              lastMod,
              lastModBy,
              commentable,
              published
            )
          )
      }

    }

}
