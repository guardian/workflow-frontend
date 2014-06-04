package lib


package object syntax {

  implicit class OptionSyntax[A](self: Option[A]) {
    /** flipped foldLeft */
    def foldl[B](f: (B, A) => B): B => B = b => self.foldLeft(b)(f)
  }

  implicit class PipeSyntax[A](self: A) {
    /** flipped apply */
    def |> [B] (f: A => B): B = f(self)
  }

}
