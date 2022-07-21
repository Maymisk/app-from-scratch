import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-reactjs';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { format, secondsInHour } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
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

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  function calculateReadtime(content) {
    const words = content.reduce((words, section) => {
      const headingWords = section.heading.split(' ').length;
      words += headingWords;

      const bodyText = RichText.asText(section.body);
      const bodyWords = bodyText.split(' ').length;

      return (words += bodyWords);
    }, 0);

    return Math.ceil(words / 200);
  }

  return (
    <>
      <header className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.banner.alt} />
      </header>
      <main className={styles.container}>
        <section className={styles.postTitleContainer}>
          <h1>{post.data.title}</h1>
          <div>
            <div>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                locale: ptBR,
              })}
            </div>
            <div>
              <FiUser />
              {post.data.author}
            </div>
            <div>
              <FiClock />
              {`${calculateReadtime(post.data.content)} min`}
            </div>
          </div>
        </section>

        <section className={styles.postContent}>
          {post.data.content.map(section => {
            return (
              <article key={section.heading}>
                <h1>{section.heading}</h1>

                {section.body.map(paragraph => {
                  return <p key={paragraph.text}>{paragraph.text}</p>;
                })}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('post');

  let uids = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: uids,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const postData = await prismic.getByUID('post', String(slug));

  const post = {
    data: {
      title: postData.data.title,
      subtitle: postData.data.subtitle,
      author: postData.data.author,
      banner: {
        url: postData.data.banner.url,
        alt: postData.data.banner.alt,
      },
      content: postData.data.content,
    },
    first_publication_date: postData.first_publication_date,
    uid: postData.uid,
  };

  return {
    props: {
      post,
    },
    revalidate: 30 * 60, // 30 mins
  };
};
