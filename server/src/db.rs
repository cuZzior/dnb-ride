use sqlx::SqlitePool;

/// Add sample organizers and events for development/demo
pub async fn seed_sample_data(pool: &SqlitePool) -> anyhow::Result<()> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM events")
        .fetch_one(pool)
        .await?;

    if count.0 > 0 {
        return Ok(());
    }

    tracing::info!("Seeding database with sample data...");

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
        // FUTURE / UPCOMING EVENTS (Sample Data)
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
        // PAST EVENTS (Historical Data from Dom Whiting)
        (
            "DnB On The Bike - LONDON NIGHT RIDE",
            "Winter night ride special through the capital.",
            "Dom Whiting",
            dom_id,
            "London",
            "United Kingdom",
            51.5074,
            -0.1278,
            "2025-12-05 19:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=9k2CnY5rCzM"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - MADRID",
            "First major ride in the Spanish capital!",
            "Dom Whiting",
            dom_id,
            "Madrid",
            "Spain",
            40.4168,
            -3.7038,
            "2025-11-02 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=ZZTMbYrKkjM"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BARCELONA",
            "Returning to the sunny streets of BCN.",
            "Dom Whiting",
            dom_id,
            "Barcelona",
            "Spain",
            41.3851,
            2.1734,
            "2025-10-23 15:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=2mGe3kYjbUQ"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - MANCHESTER",
            "Piccadilly Gardens start for the northern crew.",
            "Dom Whiting",
            dom_id,
            "Manchester",
            "United Kingdom",
            53.4808,
            -2.2426,
            "2025-10-09 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=WO94Xcpr7Kk"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - DUBLIN",
            "Double header in Ireland!",
            "Dom Whiting",
            dom_id,
            "Dublin",
            "Ireland",
            53.3498,
            -6.2603,
            "2025-10-02 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=dE92aORpcWU"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BRIGHTON",
            "Seaside vibes returning to Brighton.",
            "Dom Whiting",
            dom_id,
            "Brighton",
            "United Kingdom",
            50.8225,
            -0.1372,
            "2025-09-15 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=vu8CjMmatKk"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - CARDIFF",
            "Rolling through the Welsh capital.",
            "Dom Whiting",
            dom_id,
            "Cardiff",
            "United Kingdom",
            51.4816,
            -3.1791,
            "2025-09-22 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=c6-_V2IJJ9g"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BIRMINGHAM",
            "Summer vibes in Brum.",
            "Dom Whiting",
            dom_id,
            "Birmingham",
            "United Kingdom",
            52.4862,
            -1.8904,
            "2025-07-20 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=W9uv6U794yA"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BERLIN",
            "Techno city meets Drum & Bass.",
            "Dom Whiting",
            dom_id,
            "Berlin",
            "Germany",
            52.5200,
            13.4050,
            "2025-06-22 14:00:00",
            "approved",
            Some("https://www.youtube.com/watch?v=KKqS5_dOF2k"),
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BRISTOL",
            "The spiritual home of UK DnB.",
            "Dom Whiting",
            dom_id,
            "Bristol",
            "United Kingdom",
            51.4545,
            -2.5879,
            "2025-06-08 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - VIENNA",
            "Austrian debut ride!",
            "Dom Whiting",
            dom_id,
            "Vienna",
            "Austria",
            48.2082,
            16.3738,
            "2025-05-18 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - OXFORD",
            "Riding through the dreaming spires.",
            "Dom Whiting",
            dom_id,
            "Oxford",
            "United Kingdom",
            51.7520,
            -1.2577,
            "2025-05-04 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - ADELAIDE",
            "Down under tour continues.",
            "Dom Whiting",
            dom_id,
            "Adelaide",
            "Australia",
            -34.9285,
            138.6007,
            "2025-03-16 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BERLIN (Marathon Warmup)",
            "Winter ride in Berlin.",
            "Dom Whiting",
            dom_id,
            "Berlin",
            "Germany",
            52.5200,
            13.4050,
            "2024-12-17 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - BOURNEMOUTH",
            "Winter session by the sea.",
            "Dom Whiting",
            dom_id,
            "Bournemouth",
            "United Kingdom",
            50.7192,
            -1.8808,
            "2024-12-06 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
        ),
        (
            "DnB On The Bike - FRANKFURT",
            "German summer tour stop.",
            "Dom Whiting",
            dom_id,
            "Frankfurt",
            "Germany",
            50.1109,
            8.6821,
            "2024-07-19 14:00:00",
            "approved",
            None,
            Some("https://www.facebook.com/domwhiting/events"),
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
