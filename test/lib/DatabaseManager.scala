package test

import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.{ StaticQuery => Q }

object DatabaseManager {
  def create = {
    Database.forURL(driver = "org.postgresql.Driver", url = Config.dbUrl, user = Config.dbUser, password = Config.dbPass) withSession { implicit session =>
      Q.updateNA(s"""CREATE DATABASE "${Config.dbName}";""").execute
    }
  }

  def destroy = {
    Database.forURL(driver = "org.postgresql.Driver", url = Config.dbUrl, user = Config.dbUser, password = Config.dbPass) withSession { implicit session =>
      Q.updateNA(s"""DROP DATABASE "${Config.dbName}";""").execute
    }
  }
}


