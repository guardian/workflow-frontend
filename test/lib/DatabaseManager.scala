package test

import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.{ StaticQuery => Q, GetResult }
import org.postgresql.util.PSQLException

object DatabaseManager {
  def getDB(withDB: Boolean = true) =
    Database.forURL(
      driver = "org.postgresql.Driver",
      url = Config.dbUrl + (if(withDB) Config.dbName else ""),
      user = Config.dbUser,
      password = Config.dbPass
    )

  def query[R](sql: String)(implicit gr: GetResult[R]): List[R] =
    getDB() withSession { implicit session =>
      Q.queryNA(sql).list
    }

  def execute(sql: String, withDB: Boolean = true) = {
    try {
      getDB(withDB) withSession { implicit session =>
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

  def getCollaborators: List[(String, String)] =
    query[(String, String)]("select composer_id,email from collaborator;")

  def hasCollaborator(composerId: String, email: String): Boolean = {
    getCollaborators exists {
      case (`composerId`, `email`) => true
      case _ => false
    }
  }

}
