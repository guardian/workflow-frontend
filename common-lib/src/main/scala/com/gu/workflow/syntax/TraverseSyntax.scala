package com.gu.workflow.syntax

import play.api.libs.functional.Applicative

trait TraverseSyntax {

  implicit class TraverseOps[A](as: List[A]) {

    /* List[A] => (A => F[B]) => F[List[B]] */
    def traverse[F[_], B](f: A => F[B])(implicit F: Applicative[F]): F[List[B]] =
      as.foldRight[F[List[B]]](F.pure(Nil)) {
        (a, fbs) =>
          F.apply(F.map(fbs, (bs: List[B]) => (b: B) => b :: bs), f(a))
      }
  }
}

object TraverseSyntax extends TraverseSyntax
