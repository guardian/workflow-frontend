package test

import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.{ StaticQuery => Q }
import org.postgresql.util.PSQLException

object DatabaseManager {
  def execute(sql: String) = {
    try {
      Database.forURL(
        driver = "org.postgresql.Driver",
        url = Config.dbUrl,
        user = Config.dbUser,
        password = Config.dbPass
      ) withSession { implicit session =>
        Q.updateNA(sql).execute
      }
    } catch {
      case e: PSQLException=> {
        println(s"Could not execute $sql${e.toString}")
      }
    }
  }

  def create = {
    execute(s"""CREATE DATABASE "${Config.dbName}";""")
  }

  def truncate(tableName: String): Unit = {
    execute(s"""TRUNCATE TABLE "${tableName}" CASCADE;""")
  }

  def truncate(tables: List[String]): Unit = tables.foreach(t => truncate(t))

  def destroy = {
    execute(s"""DROP DATABASE "${Config.dbName}";""")
  }

  def clearContent = truncate(List("content", "stub"))
}


