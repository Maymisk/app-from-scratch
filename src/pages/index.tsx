import { useEffect, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { GetStaticProps } from 'next';
import Link from 'next/link';

import styles from './home.module.scss';

import { getPrismicClient } from '../services/prismic';

import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

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

export default function Home({ postsPagination }: HomeProps) {
  const [pageData, setPageData] = useState<PostPagination>(
    {} as PostPagination
  );

  useEffect(() => {
    setPageData(postsPagination);
  }, []);

  function loadMorePosts() {
    fetch(pageData.next_page)
      .then<PostPagination>(response => response.json())
      .then(data => {
        setPageData(prevState => {
          const newPosts = data.results.map(post => {
            return {
              ...post,
              first_publication_date: format(
                new Date(post.first_publication_date),
                'd MMM yyyy',
                {
                  locale: ptBR,
                }
              ),
            };
          });

          return {
            next_page: data.next_page,
            results: [...prevState.results, ...newPosts],
          };
        });
      });
  }

  return (
    <main className={styles.container}>
      <div className={styles.posts}>
        {pageData.results?.map(post => {
          return (
            <a
              href={`/post/${post.uid}`}
              key={post.uid}
              className={styles.post}
            >
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <footer>
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
              </footer>
            </a>
          );
        })}
      </div>

      {pageData.next_page && (
        <button onClick={loadMorePosts}>Carregar mais posts</button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('post', {
    pageSize: 1,
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 30 * 60, // 30 minutes
  };
};
