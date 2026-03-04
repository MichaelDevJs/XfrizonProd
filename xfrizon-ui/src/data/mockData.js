const mockData = {
  categories: [
    {
      id: 1,
      name: "Night life",
      events: [
        {
          id: 2,
          title: "Afro Night",
          date: "March 21 · 11pm - 7am",
          image:
            "data:image/jpeg;base64,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",
          description:
            "A vibrant night of Afrobeats and dance. Dress code: Elegant. Venue: Club X. Free drinks for first 50 guests.",
          organizer: {
            id: 1,
            name: "Club X",
            logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Afro_Nation.jpg/435px-Afro_Nation.jpg",
          },
          interestedCount: 2400,
          users: [
            {
              id: 1,
              name: "Alex M.",
              avatar: "https://i.pravatar.cc/32?img=1",
            },
            {
              id: 2,
              name: "Sarah K.",
              avatar: "https://i.pravatar.cc/32?img=2",
            },
            {
              id: 3,
              name: "John D.",
              avatar: "https://i.pravatar.cc/32?img=3",
            },
            {
              id: 4,
              name: "Maria G.",
              avatar: "https://i.pravatar.cc/32?img=4",
            },
          ],
          location: { country: "Germany", city: "Berlin" },
          genres: ["Afrobeats"],
        },
        {
          id: 3,
          title: "DJ Party",
          date: "April 2 · 11pm - 7am",
          image:
            "https://event-images.tixel.com/media/images/f90a12749f9cdea4e7adc663fdd4158e_1764727029_2199_l.jpg",
          description:
            "Top DJs spinning the best of Amapiano and House. Special guest: DJ Spinall. Location: The Vault.",
          organizer: {
            id: 2,
            name: "The Vault",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Live_Nation_Entertainment_logo.svg/220px-Live_Nation_Entertainment_logo.svg.png",
          },
          interestedCount: 1850,
          users: [
            {
              id: 5,
              name: "Emma T.",
              avatar: "https://i.pravatar.cc/32?img=5",
            },
            {
              id: 6,
              name: "James L.",
              avatar: "https://i.pravatar.cc/32?img=6",
            },
            {
              id: 7,
              name: "Lisa R.",
              avatar: "https://i.pravatar.cc/32?img=7",
            },
            {
              id: 8,
              name: "David P.",
              avatar: "https://i.pravatar.cc/32?img=8",
            },
            {
              id: 9,
              name: "Nina S.",
              avatar: "https://i.pravatar.cc/32?img=9",
            },
          ],
          location: { country: "UK", city: "London" },
          genres: ["House", "Amapiano"],
        },
        {
          id: 4,
          title: "Glow Night",
          date: "April 10 · 10pm - 5am",
          image: "https://images.template.net/2698/Jazz-Concert-Flyer-2x.jpg",
          description:
            "Glow sticks, neon lights, and non-stop music. Venue: Neon Club. Dress code: Bright colors!",
          organizer: {
            id: 3,
            name: "Neon Club",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Afrobeats_logo.png/220px-Afrobeats_logo.png",
          },
          interestedCount: 1620,
          users: [
            {
              id: 10,
              name: "Chris M.",
              avatar: "https://i.pravatar.cc/32?img=10",
            },
            {
              id: 11,
              name: "Anna B.",
              avatar: "https://i.pravatar.cc/32?img=11",
            },
            {
              id: 12,
              name: "Michael Z.",
              avatar: "https://i.pravatar.cc/32?img=12",
            },
            {
              id: 13,
              name: "Sofia N.",
              avatar: "https://i.pravatar.cc/32?img=13",
            },
          ],
          location: { country: "Germany", city: "Munich" },
          genres: ["Electronic", "House"],
        },
        {
          id: 5,
          title: "Soca Carnival",
          date: "April 15 · 9pm - 4am",
          image:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCQJyHuSF1IpOAUXzil9bIGwZ9zXIyJZTacA&s",
          description:
            "Caribbean vibes and Soca rhythms all night. Venue: Carnival Hall.",
          organizer: {
            id: 4,
            name: "Carnival Hall",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Spotify_logo_without_text.svg/220px-Spotify_logo_without_text.svg.png",
          },
          interestedCount: 1940,
          users: [
            {
              id: 14,
              name: "Marcus H.",
              avatar: "https://i.pravatar.cc/32?img=14",
            },
            {
              id: 15,
              name: "Julia F.",
              avatar: "https://i.pravatar.cc/32?img=15",
            },
            {
              id: 16,
              name: "Oliver W.",
              avatar: "https://i.pravatar.cc/32?img=16",
            },
            {
              id: 17,
              name: "Rachel Y.",
              avatar: "https://i.pravatar.cc/32?img=17",
            },
            {
              id: 18,
              name: "Kevin C.",
              avatar: "https://i.pravatar.cc/32?img=18",
            },
            {
              id: 19,
              name: "Sophie E.",
              avatar: "https://i.pravatar.cc/32?img=19",
            },
          ],
          location: { country: "UK", city: "Manchester" },
          genres: ["Reggae", "Dancehall"],
        },
        {
          id: 6,
          title: "Silent Disco",
          date: "April 20 · 11pm - 6am",
          image:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAbMvCBcNN0eCiAjKupmy9YZZr6f2E-FHsug&s",
          description:
            "Dance to your own beat with wireless headphones. Venue: The Loft.",
          organizer: {
            id: 5,
            name: "The Loft",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/YouTube_Music_icon_%282024%29.svg/220px-YouTube_Music_icon_%282024%29.svg.png",
          },
          interestedCount: 1530,
          users: [
            {
              id: 20,
              name: "Tyler A.",
              avatar: "https://i.pravatar.cc/32?img=20",
            },
            {
              id: 21,
              name: "Laura J.",
              avatar: "https://i.pravatar.cc/32?img=21",
            },
            {
              id: 22,
              name: "Robert D.",
              avatar: "https://i.pravatar.cc/32?img=22",
            },
          ],
          location: { country: "Germany", city: "Hamburg" },
          genres: ["House", "Electronic"],
        },
      ],
    },
    {
      id: 2,
      name: "Comedy",
      events: [
        {
          id: 55,
          title: "Laugh Out Loud",
          date: "March 28 · 8pm - 11pm",
          image:
            "https://images.unsplash.com/photo-1589519160732-57fc498494f8?auto=format&fit=crop&w=500&h=300",
          description:
            "Stand-up comedy night featuring top African comedians. Venue: Comedy House. Tickets at the door.",
          organizer: {
            id: 6,
            name: "Comedy House",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Netflix_logo.png/220px-Netflix_logo.png",
          },
          interestedCount: 1890,
          users: [
            {
              id: 23,
              name: "Adam S.",
              avatar: "https://i.pravatar.cc/32?img=23",
            },
            {
              id: 24,
              name: "Victoria M.",
              avatar: "https://i.pravatar.cc/32?img=24",
            },
            {
              id: 25,
              name: "Edward N.",
              avatar: "https://i.pravatar.cc/32?img=25",
            },
            {
              id: 26,
              name: "Grace O.",
              avatar: "https://i.pravatar.cc/32?img=26",
            },
            {
              id: 27,
              name: "Henry V.",
              avatar: "https://i.pravatar.cc/32?img=27",
            },
          ],
          location: { country: "UK", city: "London" },
          genres: ["Comedy", "Entertainment"],
        },
        {
          id: 56,
          title: "Comedy Night Live",
          date: "April 5 · 7pm - 10pm",
          image:
            "https://images.unsplash.com/photo-1520523839897-bd0b52f945e0?auto=format&fit=crop&w=500&h=300",
          description:
            "An evening of hilarious performances. Host: Top comedians. Venue: The Comedy Club.",
          organizer: {
            id: 7,
            name: "The Comedy Club",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Live_Nation_Entertainment_logo.svg/220px-Live_Nation_Entertainment_logo.svg.png",
          },
          interestedCount: 1410,
          users: [
            {
              id: 28,
              name: "George Q.",
              avatar: "https://i.pravatar.cc/32?img=28",
            },
            {
              id: 29,
              name: "Isabelle U.",
              avatar: "https://i.pravatar.cc/32?img=29",
            },
            {
              id: 30,
              name: "Joshua X.",
              avatar: "https://i.pravatar.cc/32?img=30",
            },
          ],
          location: { country: "UK", city: "Birmingham" },
          genres: ["Comedy", "Entertainment"],
        },
        {
          id: 57,
          title: "Stand-Up Saturdays",
          date: "April 12 · 9pm - 12am",
          image:
            "https://images.unsplash.com/photo-1516280318271-6f896f24ded3?auto=format&fit=crop&w=500&h=300",
          description:
            "Weekly stand-up comedy series. Featuring emerging and established comedians from Africa.",
          organizer: {
            id: 8,
            name: "Comedy Nights",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Afrobeats_logo.png/220px-Afrobeats_logo.png",
          },
          interestedCount: 1760,
          users: [
            {
              id: 31,
              name: "Kenneth Z.",
              avatar: "https://i.pravatar.cc/32?img=31",
            },
            {
              id: 32,
              name: "Lucy AA.",
              avatar: "https://i.pravatar.cc/32?img=32",
            },
            {
              id: 33,
              name: "Nathan BB.",
              avatar: "https://i.pravatar.cc/32?img=33",
            },
            {
              id: 34,
              name: "Olivia CC.",
              avatar: "https://i.pravatar.cc/32?img=34",
            },
            {
              id: 35,
              name: "Patrick DD.",
              avatar: "https://i.pravatar.cc/32?img=35",
            },
            {
              id: 36,
              name: "Quinn EE.",
              avatar: "https://i.pravatar.cc/32?img=36",
            },
            {
              id: 37,
              name: "Rachel FF.",
              avatar: "https://i.pravatar.cc/32?img=37",
            },
          ],
          location: { country: "UK", city: "Edinburgh" },
          genres: ["Comedy", "Stand-up"],
        },
        {
          id: 58,
          title: "Comedy Jam",
          date: "April 19 · 8pm - 11pm",
          image:
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&h=300",
          description:
            "Multiple comedians, one night of endless laughter. Venue: Comedy Arena. All ages welcome.",
          organizer: {
            id: 9,
            name: "Comedy Arena",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Spotify_logo_without_text.svg/220px-Spotify_logo_without_text.svg.png",
          },
          interestedCount: 1580,
          users: [
            {
              id: 38,
              name: "Stanley GG.",
              avatar: "https://i.pravatar.cc/32?img=38",
            },
            {
              id: 39,
              name: "Tina HH.",
              avatar: "https://i.pravatar.cc/32?img=39",
            },
            {
              id: 40,
              name: "Uma II.",
              avatar: "https://i.pravatar.cc/32?img=40",
            },
            {
              id: 41,
              name: "Victor JJ.",
              avatar: "https://i.pravatar.cc/32?img=41",
            },
          ],
          location: { country: "UK", city: "Bristol" },
          genres: ["Comedy", "Stand-up"],
        },
        {
          id: 59,
          title: "Roast Battle",
          date: "April 26 · 10pm - 1am",
          image:
            "https://images.unsplash.com/photo-1514888286974-6c03bf1a7cba?auto=format&fit=crop&w=500&h=300",
          description:
            "Comedians go head-to-head in hilarious roasting battles. Venue: The Comedy House.",
          organizer: {
            id: 10,
            name: "Comedy House",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Netflix_logo.png/220px-Netflix_logo.png",
          },
          interestedCount: 1670,
          users: [
            {
              id: 42,
              name: "Wendy KK.",
              avatar: "https://i.pravatar.cc/32?img=42",
            },
            {
              id: 43,
              name: "Xavier LL.",
              avatar: "https://i.pravatar.cc/32?img=43",
            },
            {
              id: 44,
              name: "Yara MM.",
              avatar: "https://i.pravatar.cc/32?img=44",
            },
            {
              id: 45,
              name: "Zachary NN.",
              avatar: "https://i.pravatar.cc/32?img=45",
            },
            {
              id: 46,
              name: "Amy OO.",
              avatar: "https://i.pravatar.cc/32?img=46",
            },
            {
              id: 47,
              name: "Brian PP.",
              avatar: "https://i.pravatar.cc/32?img=47",
            },
            {
              id: 48,
              name: "Caitlin QQ.",
              avatar: "https://i.pravatar.cc/32?img=48",
            },
            {
              id: 49,
              name: "Derek RR.",
              avatar: "https://i.pravatar.cc/32?img=49",
            },
          ],
          location: { country: "UK", city: "London" },
          genres: ["Comedy", "Roast"],
        },
      ],
    },

    // Removed the 'Artist' category and moved all its event objects to a new top-level 'artists' array below
  ],
  artists: [
    {
      id: 1,
      name: "Burna Boy",
      genre: "Afrobeat",
      followers: "500,456k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 2,
      name: "Wizkid",
      genre: "Afrobeat",
      followers: "450,200k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 3,
      name: "Tiwa Savage",
      genre: "Afrobeat",
      followers: "300,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 4,
      name: "Rema",
      genre: "Afrobeat",
      followers: "280,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 5,
      name: "CKay",
      genre: "Afrobeat",
      followers: "160,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 6,
      name: "Drake",
      genre: "Hiphop",
      followers: "1,200,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519340333755-c2f6c58f5c4b?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 7,
      name: "Kendrick Lamar",
      genre: "Hiphop",
      followers: "950,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 8,
      name: "J. Cole",
      genre: "Hiphop",
      followers: "900,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 9,
      name: "Tems",
      genre: "Rnb",
      followers: "320,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 10,
      name: "SZA",
      genre: "Rnb",
      followers: "800,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 11,
      name: "Adele",
      genre: "Soul",
      followers: "1,100,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 12,
      name: "John Legend",
      genre: "Soul",
      followers: "700,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 13,
      name: "Esperanza Spalding",
      genre: "Jazz",
      followers: "120,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 14,
      name: "Herbie Hancock",
      genre: "Jazz",
      followers: "200,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519340333755-c2f6c58f5c4b?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 15,
      name: "Burna Marley",
      genre: "Reggae",
      followers: "600,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 16,
      name: "Chronixx",
      genre: "Reggae",
      followers: "150,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 17,
      name: "Shenseea",
      genre: "DanceHall",
      followers: "180,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 18,
      name: "Vybz Kartel",
      genre: "DanceHall",
      followers: "300,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 19,
      name: "Bad Bunny",
      genre: "Latin",
      followers: "1,000,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519340333755-c2f6c58f5c4b?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 20,
      name: "J Balvin",
      genre: "Latin",
      followers: "900,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 21,
      name: "Mr Eazi",
      genre: "AfroFusion",
      followers: "220,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 22,
      name: "Focalistic",
      genre: "Amapiano",
      followers: "110,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519340333755-c2f6c58f5c4b?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 23,
      name: "DBN Gogo",
      genre: "Amapiano",
      followers: "90,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 24,
      name: "Black Coffee",
      genre: "AfroHouse",
      followers: "500,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 25,
      name: "Marc Anthony",
      genre: "Salsa",
      followers: "800,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 26,
      name: "Anitta",
      genre: "Brazil Funk",
      followers: "700,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519340333755-c2f6c58f5c4b?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 27,
      name: "Central Cee",
      genre: "UK Drill",
      followers: "300,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 28,
      name: "Headie One",
      genre: "UK Drill",
      followers: "250,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 29,
      name: "Erykah Badu",
      genre: "Soul/Jazz",
      followers: "400,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519340333755-c2f6c58f5c4b?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 30,
      name: "Anderson .Paak",
      genre: "Soul/Jazz",
      followers: "350,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 31,
      name: "Yemi Alade",
      genre: "Afrobeat",
      followers: "210,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
    {
      id: 32,
      name: "Patoranking",
      genre: "AfroFusion",
      followers: "180,000k",
      verified: true,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=2",
    },
  ],
  organizers: [],
};

export default mockData;
