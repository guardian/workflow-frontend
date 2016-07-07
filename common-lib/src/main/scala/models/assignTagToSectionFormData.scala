package models

case class assignTagToSectionFormData(sectionId: Long, tagId: String)
case class unAssignTagToSectionFormData(sectionId: Long, tagId: String)