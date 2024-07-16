import React from "react";

export type Book = {
  author: string;
  length: number;
  title: string;
};

export const describeBook = ({ author, length, title }: Book): string =>
  `${title} was written by ${author} and has ${length} pages.`;

interface Props {
  name: string;
  book?: Book;
}

export const TestReactComponent: React.FunctionComponent<Props> = ({
  name,
  book,
}) => {
  return (
    <section
      style={{
        padding: 10,
        fontSize: 30,
        color: "blue",
      }}
    >
      <p>Hello, {name}</p>
      {book && <p>{describeBook(book)}</p>}
    </section>
  );
};
