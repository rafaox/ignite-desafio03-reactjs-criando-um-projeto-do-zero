import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { AiOutlineCalendar } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import { BiTimeFive } from 'react-icons/bi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  const { content } = post.data;

  function toEStimateTime(): number {
    let accumullated = 0;
    // eslint-disable-next-line array-callback-return
    content.map(data => {
      accumullated += data.heading.split(' ').length;
      // eslint-disable-next-line array-callback-return
      data.body.map(d => {
        accumullated += d.text.split(' ').length;
      });
    });
    return Math.ceil(accumullated / 200);
  }

  const estimatedTime = toEStimateTime();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />

      <main className={styles.container}>
        <section className={styles.bannerContainer}>
          <img src={post.data.banner.url} alt="banner" />
        </section>

        <article
          key={Math.random() * post.data.title.length}
          className={styles.post}
        >
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <AiOutlineCalendar />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>

            <FiUser />
            <p>{post.data.author}</p>

            <BiTimeFive />
            <time>{estimatedTime} min</time>
          </div>

          {post.data.content.map(contentData => (
            <>
              <div
                key={Math.random() * contentData.heading.split(' ').length}
                className={styles.contentContainer}
              >
                <h2 className={styles.contentHeading}>{contentData.heading}</h2>
                <div
                  className={styles.postContent}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(contentData.body),
                  }}
                />
              </div>
            </>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: 'Pensando em sincronização em vez de ciclos de vida',
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
  };
};
