package controllers

import java.net.URI

import com.gu.hmac.HMACHeaders
import com.gu.pandomainauth.action.{AuthActions, UserRequest}
import com.gu.pandomainauth.model.User
import play.api.mvc.Results._
import play.api.mvc._

import scala.concurrent.Future

object HMACHeaderNames {
  val hmacKey = "X-Gu-Tools-HMAC-Token"
  val dateKey = "X-Gu-Tools-HMAC-Date"
  // Optional header to give the emulated user a nice name, if this isn't present we default to 'hmac-authed-service'
  val serviceNameKey = "X-Gu-Tools-Service-Name"
}

// TODO MRB: replace this copy-paste with a dependency on the actual panda-hmac library
trait HMACAuthActions extends AuthActions with HMACHeaders {
  private def authByKeyOrPanda[A](request: Request[A], block: RequestHandler[A], useApiAuth: Boolean): Future[Result] = {
    val oHmac: Option[String] = request.headers.get(HMACHeaderNames.hmacKey)
    val oDate: Option[String] = request.headers.get(HMACHeaderNames.dateKey)
    val oServiceName: Option[String] = request.headers.get(HMACHeaderNames.serviceNameKey)
    val uri = new URI(request.uri)

    (oHmac, oDate) match {
      case (Some(hmac), Some(date)) => {
        if (validateHMACHeaders(date, hmac, uri)) {
          val user = User(oServiceName.getOrElse("hmac-authed-service"), "", "", None)
          block(new UserRequest(user, request))
        } else {
          Future.successful(Unauthorized)
        }
      }
      case _ => if(useApiAuth) apiAuthByPanda(request, block) else authByPanda(request, block)
    }

  }

  type RequestHandler[A] = UserRequest[A] => Future[Result]

  def authByPanda[A](request: Request[A], block: RequestHandler[A]): Future[Result] =
    AuthAction.invokeBlock(request, (request: UserRequest[A]) => {
      block(new UserRequest(request.user, request))
    })

  def apiAuthByPanda[A](request: Request[A], block: RequestHandler[A]): Future[Result] =
    APIAuthAction.invokeBlock(request, (request: UserRequest[A]) => {
      block(new UserRequest(request.user, request))
    })

  object HMACAuthAction extends ActionBuilder[UserRequest] {
    override def invokeBlock[A](request: Request[A], block: RequestHandler[A]): Future[Result] = {
      authByKeyOrPanda(request, block, useApiAuth = false)
    }
  }

  object APIHMACAuthAction extends ActionBuilder[UserRequest] {
    override def invokeBlock[A](request: Request[A], block: RequestHandler[A]): Future[Result] =
      authByKeyOrPanda(request, block, useApiAuth = true)
  }
}

