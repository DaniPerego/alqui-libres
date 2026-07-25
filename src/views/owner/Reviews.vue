<template>
  <div class="reviews-page">
    <div class="page-header">
      <h1>Reseñas</h1>
      <div class="rating-summary" v-if="avgRating > 0">
        <span class="big-rating">⭐ {{ avgRating.toFixed(1) }}</span>
        <span class="rating-label">promedio ({{ allReviews.length }} reseñas)</span>
      </div>
    </div>

    <div v-if="allReviews.length" class="reviews-list">
      <div v-for="review in allReviews" :key="review.id" class="review-card">
        <div class="review-main">
          <div class="review-avatar">{{ review.guestName.charAt(0) }}</div>
          <div class="review-body">
            <div class="review-top">
              <strong>{{ review.guestName }}</strong>
              <span class="review-stars">⭐ {{ review.rating }}/5</span>
            </div>
            <p class="review-comment">{{ review.comment }}</p>
            <p class="review-meta">{{ formatDate(review.createdAt) }}</p>
          </div>
        </div>
        <div v-if="review.reply" class="review-reply">
          <span class="reply-label">Tu respuesta:</span>
          <p>{{ review.reply }}</p>
        </div>
        <div v-else class="reply-form">
          <input v-model="replyText[review.id]" placeholder="Responder a esta reseña..." />
          <button @click="submitReply(review.id)" :disabled="!replyText[review.id]?.trim()">Responder</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>Aún no tienes reseñas. Las reseñas aparecerán cuando los huéspedes dejen su opinión después de una reserva.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePropertyStore } from '@/stores/property'
import { getOwnerReviews } from '@/services/reviews'

const authStore = useAuthStore()
const propertyStore = usePropertyStore()

const allReviews = ref([])
const replyText = ref({})

const avgRating = computed(() => {
  if (!allReviews.value.length) return 0
  const sum = allReviews.value.reduce((s, r) => s + r.rating, 0)
  return sum / allReviews.value.length
})

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function submitReply(reviewId) {
  const text = replyText.value[reviewId]?.trim()
  if (!text) return
  const review = allReviews.value.find(r => r.id === reviewId)
  if (review) {
    review.reply = text
    const stored = JSON.parse(localStorage.getItem('alquilibres_reviews') || '[]')
    const storedReview = stored.find(r => r.id === reviewId)
    if (storedReview) storedReview.reply = text
    localStorage.setItem('alquilibres_reviews', JSON.stringify(stored))
  }
  replyText.value[reviewId] = ''
}

onMounted(async () => {
  await propertyStore.fetchProperties()
  const ownerProps = propertyStore.properties.filter(p => p.ownerId === authStore.userId)
  const propIds = ownerProps.map(p => p.id)
  allReviews.value = getOwnerReviews(propIds)
})
</script>

<style scoped>
.reviews-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
h1 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0;
}
.rating-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.big-rating {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.rating-label {
  color: #6b7280;
  font-size: 0.875rem;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.review-card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
}
.review-main {
  display: flex;
  gap: 1rem;
}
.review-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}
.review-body {
  flex: 1;
}
.review-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.review-stars {
  font-size: 0.875rem;
  color: #6b7280;
}
.review-comment {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 0.25rem;
}
.review-meta {
  color: #9ca3af;
  font-size: 0.8rem;
}
.review-reply {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 6px;
  border-left: 3px solid #22c55e;
}
.reply-label {
  font-weight: 600;
  font-size: 0.8rem;
  color: #16a34a;
  display: block;
  margin-bottom: 0.25rem;
}
.reply-form {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.reply-form input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
}
.reply-form input:focus {
  border-color: #3b82f6;
  ring: 2px solid #3b82f6;
}
.reply-form button {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.reply-form button:disabled {
  background: #9ca3af;
  cursor: default;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
</style>
