package lib

import controllers.Support
import org.scalatest._
import play.api.libs.Crypto


class LoggingTest extends FunSpec with ShouldMatchers  {
  describe("Encryption") {
    it("using play crypto library should succesfully encrypt and decrypt a string using a 16 character key") {
      val fakeApplicationSecret = "abcdefghijklmnop"
      val encrypted = Crypto.encryptAES("mysecretstring", fakeApplicationSecret)
      encrypted should not equal ("mysecretstring")
      val decrypted = Crypto.decryptAES(encrypted, fakeApplicationSecret)
      decrypted should equal ("mysecretstring")
    }
  }
  // TODO: Write a better test for Support.encryptWithApplicationSecret (talk to Phil/Lindsey about this)
}


