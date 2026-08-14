const ADAMO_PLACE_ID = "ChIJqbd-7d99yUART8XN00KUImw";

type GoogleText = {
  text?: string;
};

type GoogleReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: GoogleText;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  googleMapsUri?: string;
};

type GooglePlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  reviews?: GoogleReview[];
  googleMapsUri?: string;
};

export type GooglePlace = {
  rating: number;
  reviewCount: number;
  googleMapsUri: string;
  writeReviewUri: string;
  reviews: Array<{
    id: string;
    author: string;
    authorUri: string;
    authorPhotoUri: string;
    rating: number;
    text: string;
    relativeTime: string;
    googleMapsUri: string;
  }>;
};

export async function getGooglePlace(locale: string): Promise<GooglePlace | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const languageCode = ["ro", "ru", "en"].includes(locale) ? locale : "ro";

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${ADAMO_PLACE_ID}?languageCode=${languageCode}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
        },
        next: { revalidate: 60 * 60 },
      },
    );

    if (!response.ok) {
      console.error("Google Places request failed", response.status);
      return null;
    }

    const place = await response.json() as GooglePlaceResponse;
    if (typeof place.rating !== "number" || typeof place.userRatingCount !== "number") return null;

    return {
      rating: place.rating,
      reviewCount: place.userRatingCount,
      googleMapsUri: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${ADAMO_PLACE_ID}`,
      writeReviewUri: `https://search.google.com/local/writereview?placeid=${ADAMO_PLACE_ID}`,
      reviews: (place.reviews || []).flatMap((review) => {
        const author = review.authorAttribution;
        if (!review.name || !author?.displayName || !author.uri || !author.photoUri || !review.text?.text || !review.googleMapsUri) return [];
        return [{
          id: review.name,
          author: author.displayName,
          authorUri: author.uri,
          authorPhotoUri: author.photoUri,
          rating: review.rating || 0,
          text: review.text.text,
          relativeTime: review.relativePublishTimeDescription || "",
          googleMapsUri: review.googleMapsUri,
        }];
      }),
    };
  } catch {
    return null;
  }
}
