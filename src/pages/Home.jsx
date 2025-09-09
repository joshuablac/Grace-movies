import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context';
import {
  getDoc,
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDocs,
  collection,
  setDoc,
  query,
  limit,
} from 'firebase/firestore';
import { BookmarkArrayProvider } from '../Bookmap';
import { useNavigate } from 'react-router-dom';
import { IoBookmarkSharp } from 'react-icons/io5';
import { ToastContainer, toast } from 'react-toastify';
import { MdLocalMovies } from 'react-icons/md';
import { db, auth } from './firebase';

const Trend = (prop) => {
  return (
    <div onClick={prop.handleClick}>
      <div className='relative w-75 md:w-120 h-48 md:h-68 text-white overflow-hidden shadow-lg group bg-gray-900 p-4 flex flex-col justify-between'>
        <img
          className='w-75 md:w-110 rounded-xl h-78 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out'
          src={`https://image.tmdb.org/t/p/w500/${prop.poster_path}`}
          alt={prop.title}
        />
        <button
          className={`absolute top-6 right-8 p-2 rounded-full transition ${
            prop.isBookmark
              ? 'bg-red-700 text-white'
              : 'bg-gray-800 bg-opacity-60 text-white hover:bg-opacity-80'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            prop.isBookmark ? prop.onRemoveBookmark() : prop.onBookmark();
          }}
        >
          <IoBookmarkSharp size={18} />
        </button>
        <div className='flex items-left pl-10 text-sm md:mt-[-130px] mt-0 gap-4 opacity-95'>
          <h4>{prop.release_date?.slice(0, 4)}</h4>
          <h5 className='text-sm font-semibold leading-tight truncate'>
            {prop.movie_vote}
          </h5>
          <p className='flex text-sm'>
            <MdLocalMovies className='mt-1' />
            {prop.movie_type}
          </p>
          <p>PG</p>
        </div>
        <h1 className='text-2xl text-white font-semibold leading-tight truncate flex items-left pl-10'>
          {prop.title}
        </h1>
      </div>
    </div>
  );
};

const Tree = (prop) => {
  return (
    <div onClick={prop.handleClick}>
      <div className='relative w-90 h-98 md:h-83 text-white overflow-hidden group bg-gray-900 p-4 flex flex-col justify-between gap-4'>
        <img
          className='w-90 rounded-xl h-68 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out'
          src={`https://image.tmdb.org/t/p/w500/${
            prop.backdrop_path || prop.poster_path
          }`}
          alt={prop.title}
        />
        <button
          className={`absolute top-6 right-10 p-2 rounded-full transition ${
            prop.isBookmark
              ? 'bg-red-700 text-white'
              : 'bg-gray-800 bg-opacity-60 text-white hover:bg-opacity-80'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            prop.isBookmark ? prop.onRemoveBookmark() : prop.onBookmark();
          }}
        >
          <IoBookmarkSharp size={18} />
        </button>
        <div>
          <div className='flex items-left pl-5 text-sm mt-0 gap-4 opacity-95'>
            <h4>{prop.first_air_date?.slice(0, 4)}</h4>
            <h5 className='text-sm font-semibold leading-tight truncate'>
              {prop.movie_vote}
            </h5>
            <p className='flex text-sm'>
              <MdLocalMovies className='mt-1' />
              {prop.movie_type}
            </p>
            <p>PG</p>
          </div>
          <h1 className='text-2xl text-white font-semibold leading-tight truncate flex items-left pl-5'>
            {prop.name?.slice(0, 23)}
          </h1>
        </div>
      </div>
    </div>
  );
};

const Home = ({ onLogin }) => {
  const navigate = useNavigate();
  const { setDetails } = useContext(UserContext);
  const [movies, setMovies] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const userUid = localStorage.getItem('myUserId');
  const [bookmarkedMovies, setBookmarkedMovies] = useState([]);

  const handleBookmarkClick = async (movie) => {
    setBookmarkedMovies((prev) => {
      const isAlreadyAdded = prev.some((m) => m.id === movie.id);
      if (isAlreadyAdded) return prev;
      const update = [...prev, movie];
      const saveBook = doc(db, 'movieBook', userUid);
      setDoc(saveBook, {
        details: update,
      });
      return update;
    });
  };

  const filterBook = async (movie) => {
    const saveBook = doc(db, 'movieBook', userUid);
    const snap = await getDoc(saveBook);
    const existingBookmarks = snap.exists() ? snap.data().details || [] : [];
    const isAlreadyBookmarked = existingBookmarks.some(
      (m) => m.id === movie.id
    );

    if (isAlreadyBookmarked) {
      await updateDoc(saveBook, {
        details: arrayRemove(movie),
      });
      setBookmarkedMovies((prev) => prev.filter((m) => m.id !== movie.id));
      console.log('✅ Removed from Firestore');
    } else {
      await setDoc(
        saveBook,
        {
          details: arrayUnion(movie),
        },
        { merge: true }
      );
      setBookmarkedMovies((prev) => [...prev, movie]);
      console.log('✅ Added to Firestore');
    }
  };

  const getData = async (movie) => {
    setDetails([movie]);
    navigate('./project');
  };

  const fetchRecommendations = async () => {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjA4OTUxYmI3ZjI5OTYwZGUzNThmYzBiODZjNWU2NyIsIm5iZiI6MTc1MTYzMTY1NS44MzAwMDAyLCJzdWIiOiI2ODY3YzcyNzA2YjgyNzQ2NmU1M2I4YTIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.7dHa7DBREfgiJkB7wiCYLMDJFv2LBXLDcYMBtpaQyBA',
      },
    };

    let totalPages = 4;
    const fetchPromises = [];

    for (let i = 1; i <= totalPages; i++) {
      const url = `https://api.themoviedb.org/3/tv/airing_today?language=en-US&page=${i}`;
      fetchPromises.push(fetch(url, options).then((res) => res.json()));
    }

    const forbiddenGenres = [27, 53, 80, 9648, 99, 10764, 10766, 10749];
    const blacklist = [
      'sex',
      'erotic',
      'evil',
      'lust',
      'sin',
      'sinners',
      'horror',
      'curse',
      'thriller',
      'demon',
      'witch',
      'kill',
      'murder',
      'love',
      'romance',
      'romantic',
      'affair',
      'affairs',
      'mistress',
    ];

    const responses = await Promise.all(fetchPromises);

    const allMovies = responses
      .flatMap((res) => res.results)
      .filter(
        (tv) =>
          !tv.genre_ids?.some((id) => forbiddenGenres.includes(id)) &&
          !blacklist.some(
            (word) =>
              (tv.name || '').toLowerCase().includes(word) ||
              (tv.original_name || '').toLowerCase().includes(word) ||
              (tv.overview || '').toLowerCase().includes(word)
          )
      );

    try {
      const movieRef = doc(db, 'movies2', '550');
      await setDoc(movieRef, { allMovies });
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  };

  const movieRecommendation = async () => {
    const movieDoc = doc(db, 'movies2', '550');
    const snapshot = await getDoc(movieDoc);

    if (snapshot.exists()) {
      const data = snapshot.data();
      setRecommended(data.allMovies);
    } else {
      console.log('Document not found');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);
        if (userSnap.exists()) {
          const name = userSnap.data().firstName.toUpperCase();
          toast.success(`Welcome ${name}`, {
            position: 'top-center',
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    movieRecommendation();
    fetchRecommendations();
    const fetchMovies = async () => {
      const moviesCollection = query(collection(db, 'movies'), limit(8));
      try {
        const snapShot = await getDocs(moviesCollection);
        const movies = snapShot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMovies(movies);
      } catch {
        console.error('Error fetching movies:');
      }
    };
    fetchMovies();
  }, [userUid]);

  return (
    <BookmarkArrayProvider value={bookmarkedMovies}>
      <ToastContainer />
      <div className='bg-gray-900 z-0 min-h-screen w-screen overflow-hidden'>
        <div>
          <h1 className='md:text-4xl text-2xl pl-24 md:pl-27 bg-gray-900 text-white w-full h-17 pt-4'>
            Trending
          </h1>
          <div className='text-blue-600 gap-9 overflow-x-auto bg-gray-900 flex w-screen md:pl-30 whitespace-nowrap no-scrollbar'>
            {movies.map((movie) => (
              <div key={movie.id}>
                <Trend
                  {...movie}
                  onBookmark={() => {
                    auth.onAuthStateChanged(async (user) => {
                      if (user) {
                        handleBookmarkClick(movie);
                      } else {
                        onLogin();
                      }
                    });
                  }}
                  onRemoveBookmark={() => filterBook(movie)}
                  isBookmark={bookmarkedMovies.some((m) => m.id === movie.id)}
                  handleClick={() => getData(movie)}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className='md:text-4xl text-2xl md:text-left text-center md:pl-30 pl-5 bg-gray-900 text-white w-full h-17 pt-14'>
            Recommended for you
          </h1>
          <div className='text-blue-600 justify-center flex-row gap-4 pl-10 flex-wrap flex overflow-y-auto w-screen pt-10 mx-auto items-center whitespace-nowrap no-scrollbar'>
            {recommended.map((movie) => (
              <div key={movie.id}>
                <Tree
                  {...movie}
                  onBookmark={() => {
                    auth.onAuthStateChanged(async (user) => {
                      if (user) {
                        handleBookmarkClick(movie);
                      } else {
                        onLogin();
                      }
                    });
                  }}
                  onRemoveBookmark={() => filterBook(movie)}
                  isBookmark={bookmarkedMovies.some((m) => m.id === movie.id)}
                  handleClick={() => getData(movie)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </BookmarkArrayProvider>
  );
};

export default Home;
