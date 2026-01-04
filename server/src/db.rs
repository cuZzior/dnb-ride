use sqlx::SqlitePool;

/// Initialize database with required tables
pub async fn init_db(pool: &SqlitePool) -> anyhow::Result<()> {
    // Create organizers table first
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS organizers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            website TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create events table with optional organizer_id FK
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            organizer TEXT NOT NULL,
            organizer_id INTEGER REFERENCES organizers(id),
            location_name TEXT NOT NULL,
            country TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            event_date DATETIME NOT NULL,
            image_url TEXT,
            video_url TEXT,
            event_link TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes for common queries
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_organizers_slug ON organizers(slug)")
        .execute(pool)
        .await?;

    // Create video suggestions table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS video_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL REFERENCES events(id),
            video_url TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_suggestions_status ON video_suggestions(status)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_suggestions_event ON video_suggestions(event_id)")
        .execute(pool)
        .await?;

    // Seed if empty
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM events")
        .fetch_one(pool)
        .await?;

    if count.0 == 0 {
        seed_sample_data(pool).await?;
    }

    tracing::info!("Database initialized successfully");
    Ok(())
}

/// Add sample organizers and events for development/demo
async fn seed_sample_data(pool: &SqlitePool) -> anyhow::Result<()> {
    // Insert organizers
    let organizers = vec![
        (
            "Dom Whiting",
            "dom-whiting",
            "The original DNB On Bike creator from the UK.",
        ),
        (
            "NH Kolektyw",
            "nh-kolektyw",
            "Polish drum and bass collective organizing bike rides.",
        ),
        (
            "Berlin DNB Crew",
            "berlin-dnb-crew",
            "German DNB community based in Berlin.",
        ),
    ];

    for (name, slug, desc) in &organizers {
        sqlx::query("INSERT OR IGNORE INTO organizers (name, slug, description) VALUES (?, ?, ?)")
            .bind(name)
            .bind(slug)
            .bind(desc)
            .execute(pool)
            .await?;
    }

    // Get organizer IDs
    let dom_id: Option<(i64,)> =
        sqlx::query_as("SELECT id FROM organizers WHERE slug = 'dom-whiting'")
            .fetch_optional(pool)
            .await?;
    let nh_id: Option<(i64,)> =
        sqlx::query_as("SELECT id FROM organizers WHERE slug = 'nh-kolektyw'")
            .fetch_optional(pool)
            .await?;
    let berlin_id: Option<(i64,)> =
        sqlx::query_as("SELECT id FROM organizers WHERE slug = 'berlin-dnb-crew'")
            .fetch_optional(pool)
            .await?;

    let dom_id = dom_id.map(|x| x.0);
    let nh_id = nh_id.map(|x| x.0);
    let berlin_id = berlin_id.map(|x| x.0);

    // (title, desc, organizer_name, organizer_id, location, country, lat, lng, date, status, video_url, event_link)
    let sample_events: Vec<(
        &str,
        &str,
        &str,
        Option<i64>,
        &str,
        &str,
        f64,
        f64,
        &str,
        &str,
        Option<&str>,
        Option<&str>,
    )> = vec![
        (
            "London DNB On Bike - Spring Edition",
            "Join Dom Whiting for the original DNB On Bike experience through London streets!",
            "Dom Whiting",
            dom_id,
            "London",
            "United Kingdom",
            51.5074,
            -0.1278,
            "2026-03-15 14:00:00",
            "approved",
            None,
            Some("https://facebook.com/events/123456789"),
        ),
        (
            "Manchester Bass Ride",
            "Northern edition of the legendary bike ride. Bring your speakers!",
            "Dom Whiting",
            dom_id,
            "Manchester",
            "United Kingdom",
            53.4808,
            -2.2426,
            "2026-04-20 13:00:00",
            "approved",
            None,
            Some("https://instagram.com/domwhiting"),
        ),
        (
            "Warsaw DNB Przejazd",
            "NH Kolektyw zaprasza na przejazd rowerowy z drum and bass przez Warszawe!",
            "NH Kolektyw",
            nh_id,
            "Warszawa",
            "Poland",
            52.2297,
            21.0122,
            "2026-04-05 15:00:00",
            "approved",
            None,
            Some("https://facebook.com/nhkolektyw"),
        ),
        (
            "Krakow Bass na Kolkach",
            "Drum & Bass na rowerach wokol Plant i Wisly!",
            "NH Kolektyw",
            nh_id,
            "Krakow",
            "Poland",
            50.0647,
            19.9450,
            "2026-05-10 14:00:00",
            "approved",
            None,
            None,
        ),
        (
            "Brighton Beach Beats",
            "Seaside drum and bass cycling adventure.",
            "Dom Whiting",
            dom_id,
            "Brighton",
            "United Kingdom",
            50.8225,
            -0.1372,
            "2025-08-20 12:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            None,
        ),
        (
            "Berlin Bass Fahrt",
            "Drum and Bass bike ride through Berlin!",
            "Berlin DNB Crew",
            berlin_id,
            "Berlin",
            "Germany",
            52.5200,
            13.4050,
            "2026-06-15 14:00:00",
            "pending",
            None,
            None,
        ),
    ];

    for (
        title,
        desc,
        organizer,
        organizer_id,
        location,
        country,
        lat,
        lng,
        date,
        status,
        video_url,
        event_link,
    ) in &sample_events
    {
        sqlx::query(
            r#"
            INSERT INTO events (title, description, organizer, organizer_id, location_name, country, latitude, longitude, event_date, status, video_url, event_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(title)
        .bind(desc)
        .bind(organizer)
        .bind(organizer_id)
        .bind(location)
        .bind(country)
        .bind(lat)
        .bind(lng)
        .bind(date)
        .bind(status)
        .bind(video_url)
        .bind(event_link)
        .execute(pool)
        .await?;
    }

    tracing::info!(
        "Seeded {} organizers and {} events",
        organizers.len(),
        sample_events.len()
    );
    Ok(())
}
