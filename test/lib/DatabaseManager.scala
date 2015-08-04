package test

import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.{ StaticQuery => Q }
import org.postgresql.util.PSQLException

object DatabaseManager {
  def execute(sql: String, withDB: Boolean = true) = {
    try {
      Database.forURL(
        driver = "org.postgresql.Driver",
        url = Config.dbUrl + (if(withDB) Config.dbName else ""),
        user = Config.dbUser,
        password = Config.dbPass
      ) withSession { implicit session =>
        println(s"PMR - Connecting to ${Config.dbName}")
        Q.updateNA(sql).execute
      }
    } catch {
      case e: PSQLException=> {
        println(s"Could not execute $sql${e.toString}")
      }
    }
  }

  def create = {
    execute(s"""CREATE DATABASE "${Config.dbName}";""", withDB = false)
  }

  def truncate(tableName: String): Unit = {
    execute(s"""TRUNCATE TABLE "${tableName}" CASCADE;""")
  }

  def truncate(tables: List[String]): Unit = tables.foreach(t => truncate(t))

  def destroy = {
    execute(s"""DROP DATABASE "${Config.dbName}";""", false)
  }

  def clearContent = truncate(List("content", "stub"))
}
