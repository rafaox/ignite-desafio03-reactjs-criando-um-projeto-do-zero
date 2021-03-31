import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { AiOutlineCalendar } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  const [nextPage, setNextPage] = useState(next_page);
  const [posts, setPosts] = useState(results);

  async function handleLoadMorePosts(): Promise<void> {
    await fetch(next_page)
      .then(res => res.json())
      .then(res => {
        setNextPage(res.next_page);
        if (res.results[0]) {
          const nextPagePosts: Post[] = res.results.map(post => {
            return {
              uid: post.uid,
              first_publication_date: format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR,
                }
              ),
              data: {
                title: post.data?.title ?? '',
                subtitle: post.data?.subtitle ?? '',
                author: post.data?.author ?? '',
              },
            };
          });
          setPosts([...posts, ...nextPagePosts]);
        }
      });
  }

  return (
    <>
      <header className={styles.headerContainer}>
        <img src="/Logo.svg" alt="logo" />
      </header>

      <main className={styles.postContainer}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`}>
            <a>
              <article key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <AiOutlineCalendar />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <FiUser />
                  <p>{post.data.author}</p>
                </div>
              </article>
            </a>
          </Link>
        ))}
        {nextPage ? (
          <button type="button" onClick={handleLoadMorePosts}>
            Carregar mais posts
          </button>
        ) : (
          ''
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data?.title ?? '',
          subtitle: post.data?.subtitle ?? '',
          author: post.data?.author ?? '',
        },
      };
    }),
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 30,
  };
};
