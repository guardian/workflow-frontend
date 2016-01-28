package lib

import lib.Response._

object DBToAPIResponse {

  def updateStubRes(id: Long, updatedRow: Int): Response[Long] = {
    if(updatedRow==0) Left(ApiErrors.updateError(id))
    else Right(ApiSuccess(id))
  }

  def updateWorkflowRes(id: String, updatedRow: Int): Response[String] = {
    if(updatedRow==0) Left(ApiErrors.composerIdNotFound(id))
    else Right(ApiSuccess(id))
  }

  def createContentResponse(id: Option[Long]): Response[Long] = {
    id match {
      case Some(i) => Right(ApiSuccess(i))
      case None => Left(ApiErrors.conflict)
    }
  }

}
