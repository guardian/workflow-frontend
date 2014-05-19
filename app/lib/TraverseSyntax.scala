package lib

import play.api.libs.functional.Applicative


object TraverseSyntax {

  implicit class TraverseOps[A](as: List[A]) {
    def traverse[F[_], B](f: A => F[B])(implicit F: Applicative[F]): F[List[B]] =
      as.foldRight[F[List[B]]](F.pure(Nil)) {
        (a, fbs) =>
          F.apply(F.map(fbs, (bs: List[B]) => (b: B) => b :: bs), f(a))
      }
  }

}
