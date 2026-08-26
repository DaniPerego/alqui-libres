<template>
  <div class="property-detail" v-if="property">
    <div class="container">
      <!-- Galería de Imágenes -->
      <div class="image-gallery">
        <div class="main-image">
          <img :src="currentImage" :alt="property.title" loading="lazy" />
        </div>
        <div class="thumbnail-grid" v-if="property.images.length > 1">
          <img
            v-for="(image, index) in property.images.slice(0, 5)"
            :key="index"
            :src="image"
            :alt="`${property.title} ${index + 1}`"
            loading="lazy"
            @click="currentImage = image"
            :class="{ active: currentImage === image }"
          />
        </div>
      </div>
      
      <div class="detail-content">
        <!-- Información Principal -->
        <div class="main-info">
          <div class="property-header">
            <div>
              <h1 class="property-title">{{ property.title }}</h1>
              <p class="property-location">
                <MapPin :size="16" /> {{ property.location.city }}, {{ property.location.state }}
              </p>
              <div class="rental-type-badge" :class="property.rentalType">
                <template v-if="property.rentalType === 'anual'">
                  <Calendar :size="16" /> Alquiler Anual
                </template>
                <template v-else>
                  <Calendar :size="16" /> Alquiler Temporario
                </template>
              </div>
              <div class="property-meta">
                <span>{{ property.capacity.guests }} huéspedes</span>
                <span>•</span>
                <span>{{ property.capacity.bedrooms }} habitaciones</span>
                <span>•</span>
                <span>{{ property.capacity.beds }} camas</span>
                <span>•</span>
                <span>{{ property.capacity.bathrooms }} baños</span>
              </div>
            </div>
            <div v-if="property.rating" class="property-rating">
              <span class="rating-value"><Star :size="16" fill="#fbbf24" stroke="#fbbf24" /> {{ property.rating.toFixed(1) }}</span>
              <span class="rating-count">({{ property.reviewCount }} reseñas)</span>
            </div>
          </div>
          
          <!-- Descripción -->
          <section class="detail-section">
            <h2 class="section-title">Sobre esta propiedad</h2>
            <p class="property-description">{{ property.description }}</p>
          </section>
          
          <!-- Características Locales Destacadas -->
          <section class="detail-section highlight-section" v-if="property.localFeatures">
            <h2 class="section-title">Características Especiales</h2>
            <div class="features-grid">
              <div v-if="property.localFeatures.grillType" class="feature-item">
                <span class="feature-icon"><Flame :size="20" /></span>
                <div>
                  <strong>Parrilla {{ property.localFeatures.grillType }}</strong>
                  <p>Perfecta para asados al aire libre</p>
                </div>
              </div>
              
              <div v-if="property.localFeatures.parkingSize" class="feature-item">
                <span class="feature-icon"><Car :size="20" /></span>
                <div>
                  <strong>Cochera {{ property.localFeatures.parkingSize }}</strong>
                  <p>Estacionamiento seguro</p>
                </div>
              </div>
              
              <div v-if="property.localFeatures.distanceToCenter" class="feature-item">
                <span class="feature-icon"><MapPin :size="20" /></span>
                <div>
                  <strong>{{ property.localFeatures.distanceToCenter }} km del centro</strong>
                  <p>Ubicación conveniente</p>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Amenidades -->
          <section class="detail-section">
            <h2 class="section-title">Comodidades</h2>
            <div class="amenities-grid">
              <div v-for="amenity in property.amenities" :key="amenity" class="amenity-item">
                <span class="amenity-icon"><CheckCircle :size="16" /></span>
                <span>{{ amenity }}</span>
              </div>
            </div>
          </section>
          
          <!-- Contacto del Propietario -->
          <section class="detail-section contact-section">
            <h2 class="section-title"><User :size="20" /> Contacta con el Propietario</h2>
            
            <!-- Usuario autenticado: Mostrar contactos -->
            <div v-if="isAuthenticated && ownerProfile" class="owner-contact-info">
              <div class="owner-header">
                <div class="owner-avatar">
                  <img v-if="ownerProfile.photoURL" :src="ownerProfile.photoURL" :alt="ownerProfile.displayName">
                  <div v-else class="avatar-placeholder">
                    {{ ownerProfile.displayName?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                </div>
                <div class="owner-details">
                  <h3>{{ ownerProfile.displayName || 'Propietario' }}</h3>
                  <p v-if="ownerProfile.city" class="owner-location"><MapPin :size="16" /> {{ ownerProfile.city }}</p>
                  <p v-if="ownerProfile.bio" class="owner-bio">{{ ownerProfile.bio }}</p>
                </div>
              </div>
              
              <!-- Contacto Principal -->
              <div class="contact-methods">
                <h4><Phone :size="18" /> Contacto Principal</h4>
                <div class="contact-buttons">
                  <a 
                    v-if="ownerProfile.contactoPrincipal?.whatsapp" 
                    :href="getWhatsAppLink(ownerProfile.contactoPrincipal.whatsapp, property.title)" 
                    target="_blank"
                    class="contact-btn whatsapp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                  
                  <a 
                    v-if="ownerProfile.contactoPrincipal?.telefono" 
                    :href="`tel:${ownerProfile.contactoPrincipal.telefono}`"
                    class="contact-btn phone"
                  >
                    <Phone :size="18" /> {{ ownerProfile.contactoPrincipal.telefono }}
                  </a>
                  
                  <a 
                    v-if="ownerProfile.contactoPrincipal?.email || ownerProfile.email" 
                    :href="`mailto:${ownerProfile.contactoPrincipal?.email || ownerProfile.email}`"
                    class="contact-btn email"
                  >
                    <Mail :size="18" /> Enviar Email
                  </a>
                </div>
              </div>
              
              <!-- Contacto Secundario -->
              <div v-if="ownerProfile.contactoSecundario?.enabled && ownerProfile.contactoSecundario?.telefono" class="contact-methods secondary">
                <h4><Phone :size="16" /> {{ ownerProfile.contactoSecundario.descripcion || 'Contacto Secundario' }}</h4>
                <div class="contact-buttons">
                  <a 
                    v-if="ownerProfile.contactoSecundario.whatsapp" 
                    :href="getWhatsAppLink(ownerProfile.contactoSecundario.whatsapp, property.title)" 
                    target="_blank"
                    class="contact-btn whatsapp small"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                  
                  <a 
                    v-if="ownerProfile.contactoSecundario.telefono" 
                    :href="`tel:${ownerProfile.contactoSecundario.telefono}`"
                    class="contact-btn phone small"
                  >
                    <Phone :size="18" /> {{ ownerProfile.contactoSecundario.telefono }}
                  </a>
                  
                  <a 
                    v-if="ownerProfile.contactoSecundario.email" 
                    :href="`mailto:${ownerProfile.contactoSecundario.email}`"
                    class="contact-btn email small"
                  >
                    <Mail :size="18" /> Email
                  </a>
                </div>
              </div>
              
              <!-- Redes Sociales -->
              <div v-if="hasSocialMedia" class="social-media">
                <h4><Globe :size="18" /> Redes Sociales</h4>
                <div class="social-links">
                  <a v-if="ownerProfile.redesSociales?.instagram" 
                     :href="`https://instagram.com/${ownerProfile.redesSociales.instagram}`" 
                     target="_blank" 
                     class="social-link instagram"
                  >
                    Instagram
                  </a>
                  <a v-if="ownerProfile.redesSociales?.facebook" 
                     :href="`https://facebook.com/${ownerProfile.redesSociales.facebook}`" 
                     target="_blank" 
                     class="social-link facebook"
                  >
                    Facebook
                  </a>
                  <a v-if="ownerProfile.redesSociales?.linkedin" 
                     :href="`https://linkedin.com/in/${ownerProfile.redesSociales.linkedin}`" 
                     target="_blank" 
                     class="social-link linkedin"
                  >
                    <ExternalLink :size="16" /> LinkedIn
                  </a>
                  <a v-if="ownerProfile.redesSociales?.website" 
                     :href="ownerProfile.redesSociales.website" 
                     target="_blank" 
                     class="social-link website"
                  >
                    <Globe :size="18" /> Sitio Web
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Usuario NO autenticado: Mostrar mensaje difuminado -->
            <div v-else class="contact-locked">
              <div class="blur-overlay">
                <div class="lock-icon"><Lock :size="48" /></div>
                <h3>Regístrate para ver los datos de contacto</h3>
                <p>Crea una cuenta gratuita para conectar directamente con el propietario</p>
                <div class="contact-preview">
                  <div class="preview-item"><Phone :size="18" /> Teléfono</div>
                  <div class="preview-item"><MessageSquare :size="18" /> WhatsApp</div>
                  <div class="preview-item"><Mail :size="18" /> Email</div>
                  <div class="preview-item"><Globe :size="18" /> Redes Sociales</div>
                </div>
                <router-link to="/registro" class="btn btn-primary btn-lg">
                  Crear Cuenta Gratis
                </router-link>
                <p class="small-text">
                  ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link>
                </p>
              </div>
            </div>
          </section>
          
          <!-- Calendario de Disponibilidad -->
          <section class="detail-section">
            <h2 class="section-title">Disponibilidad</h2>
            <div class="calendar-placeholder">
              <p><Calendar :size="16" /> Calendario de disponibilidad</p>
              <p class="calendar-note">Selecciona tus fechas para ver la disponibilidad</p>
            </div>
          </section>
        </div>
        
        <!-- Sidebar de Reserva -->
        <aside class="booking-sidebar card">
          <div class="pricing-info">
            <div class="price-display">
              
              <span class="price-period">{{ property.rentalType === 'anual' ? '/ mes' : '/ noche' }}</span>
            </div>
            <div v-if="property.rentalType !== 'anual' && property.pricing.cleaningFee > 0" class="additional-fees">
              <span>Tarifa de limpieza: ${{ property.pricing.cleaningFee }}</span>
            </div>
          </div>
          
          <div v-if="property.rentalType === 'anual'" class="annual-notice">
            <p><Calendar :size="16" /> Esta propiedad se alquila por mes.</p>
            <p>Consultá disponibilidad y condiciones contactando al propietario.</p>
          </div>
          <div v-else class="booking-form">
            <div class="form-group">
              <label class="label">Check-in</label>
              <DatePicker
                v-model="bookingDates.checkIn"
                type="date"
                :disabled-date="isDateDisabled"
                format="YYYY-MM-DD"
                input-class="input"
                placeholder="Selecciona fecha de entrada"
              />
            </div>
            <div class="form-group">
              <label class="label">Check-out</label>
              <DatePicker
                v-model="bookingDates.checkOut"
                type="date"
                :disabled-date="isDateDisabled"
                format="YYYY-MM-DD"
                input-class="input"
                placeholder="Selecciona fecha de salida"
              />
            </div>
            <div class="form-group">
              <label class="label">Huéspedes</label>
              <select v-model.number="bookingDates.guests" class="select">
                <option v-for="n in property.capacity.guests" :key="n" :value="n">
                  {{ n }} {{ n === 1 ? 'huésped' : 'huéspedes' }}
                </option>
              </select>
            </div>
          </div>
          
          <div v-if="property.rentalType === 'anual'" class="price-breakdown">
            <div class="price-row total">
              <strong>Precio mensual</strong>
              <strong>${{ property.pricing.basePrice }}</strong>
            </div>
          </div>
          <div v-else-if="totalPrice > 0" class="price-breakdown">
            <div class="price-row">
              <span>${{ property.pricing.basePrice }} x {{ nights }} noches</span>
              <span>${{ property.pricing.basePrice * nights }}</span>
            </div>
            <div v-if="property.pricing.cleaningFee > 0" class="price-row">
              <span>Tarifa de limpieza</span>
              <span>${{ property.pricing.cleaningFee }}</span>
            </div>
            <div class="price-row total">
              <strong>Total</strong>
              <strong>${{ totalPrice }}</strong>
            </div>
          </div>
          
          <button @click="openReservationModal" class="btn btn-primary btn-lg">
            <Calendar :size="16" /> Solicitar Reserva
          </button>
          
          <p class="no-fees-notice">
            <CheckCircle :size="16" /> Precio final sin cargos ocultos<br>
            <CheckCircle :size="16" /> Sin comisiones adicionales<br>
            <CheckCircle :size="16" /> Respuesta en menos de 24hs
          </p>
        </aside>
      </div>

      <!-- Modal de Reserva -->
      <Teleport to="body">
        <div v-if="showReservationModal" class="modal-overlay" @click="showReservationModal = false">
          <div class="modal reservation-modal" @click.stop>
            <div class="modal-header">
              <h2><Calendar :size="20" /> Solicitar Reserva</h2>
              <button @click="showReservationModal = false" class="close-btn"><X :size="20" /></button>
            </div>
            <div class="modal-body">
              <div class="reservation-summary">
                <img :src="property.images[0]" :alt="property.title" class="summary-image">
                <div>
                  <h3>{{ property.title }}</h3>
                  <p><MapPin :size="16" /> {{ property.location.city }}, {{ property.location.state }}</p>
                </div>
              </div>

              <div v-if="!isAuthenticated" class="auth-required">
                <p>Debes iniciar sesión para solicitar una reserva</p>
                <router-link to="/login" class="btn btn-primary">
                  Iniciar Sesión
                </router-link>
                <p class="small-text">
                  ¿No tienes cuenta? <router-link to="/registro">Regístrate gratis</router-link>
                </p>
              </div>

              <form v-else @submit.prevent="submitReservation" class="reservation-form">
                <div class="form-row">
                  <div class="form-group">
                    <label class="label required">Check-in</label>
                    <DatePicker
                      v-model="reservationForm.checkIn"
                      type="date"
                      :disabled-date="isDateDisabled"
                      format="YYYY-MM-DD"
                      input-class="input"
                      placeholder="Selecciona fecha de entrada"
                      required
                    />
                  </div>
                  <div class="form-group">
                    <label class="label required">Check-out</label>
                    <DatePicker
                      v-model="reservationForm.checkOut"
                      type="date"
                      :disabled-date="isDateDisabled"
                      format="YYYY-MM-DD"
                      input-class="input"
                      placeholder="Selecciona fecha de salida"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="label required">Número de Huéspedes</label>
                  <select v-model.number="reservationForm.guests" class="input" required>
                    <option value="">Seleccionar...</option>
                    <option v-for="n in property.capacity.guests" :key="n" :value="n">
                      {{ n }} {{ n === 1 ? 'huésped' : 'huéspedes' }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="label required">Tu Nombre</label>
                  <input 
                    v-model="reservationForm.name" 
                    type="text" 
                    class="input"
                    placeholder="Nombre completo"
                    required
                  >
                </div>

                <div class="form-group">
                  <label class="label required">Email</label>
                  <input 
                    v-model="reservationForm.email" 
                    type="email" 
                    class="input"
                    placeholder="tu@email.com"
                    required
                  >
                </div>

                <div class="form-group">
                  <label class="label">Teléfono (WhatsApp)</label>
                  <input 
                    v-model="reservationForm.phone" 
                    type="tel" 
                    class="input"
                    placeholder="+54 351 123-4567"
                  >
                  <p class="help-text">Opcional. Te contactaremos por WhatsApp si lo proporcionas.</p>
                </div>

                <div class="form-group">
                  <label class="label">Mensaje (opcional)</label>
                  <textarea 
                    v-model="reservationForm.message" 
                    class="textarea"
                    rows="3"
                    placeholder="Cuéntanos sobre tu estadía, necesidades especiales, etc."
                  ></textarea>
                </div>

                <div v-if="reservationNights > 0" class="price-summary">
                  <div class="summary-row">
                    <span>${{ property.pricing.basePrice }} x {{ reservationNights }} noches</span>
                    <span>${{ property.pricing.basePrice * reservationNights }}</span>
                  </div>
                  <div v-if="property.pricing.cleaningFee > 0" class="summary-row">
                    <span>Tarifa de limpieza</span>
                    <span>${{ property.pricing.cleaningFee }}</span>
                  </div>
                  <div class="summary-row total">
                    <strong>Total estimado</strong>
                    <strong>${{ reservationTotal }}</strong>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg" :disabled="submittingReservation">
                  {{ submittingReservation ? 'Enviando...' : '' }} <Send :size="18" /> Enviar Solicitud
                </button>

                <p class="form-note">
                  Tu solicitud será enviada al propietario. Recibirás una confirmación por email.
                </p>
              </form>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Toast de Confirmación -->
      <Transition name="toast">
        <div v-if="showToast" class="toast success">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>
      
      <!-- Reseñas -->
      <section class="reviews-section">
        <h2 class="section-title">Reseñas de Huéspedes <span v-if="reviews.length">({{ reviews.length }})</span></h2>
        <div class="reviews-grid" v-if="reviews.length">
          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <strong>{{ review.guestName }}</strong>
              <span class="review-rating"><Star :size="16" fill="#fbbf24" stroke="#fbbf24" /> {{ review.rating }}</span>
            </div>
            <p class="review-date">{{ formatDate(review.createdAt) }}</p>
            <p class="review-comment">{{ review.comment }}</p>
            <span v-if="review.verified" class="verified-badge"><CheckCircle :size="16" /> Verificado</span>
          </div>
        </div>
        <div v-else class="reviews-empty">
          <p>Esta propiedad aún no tiene reseñas. Sé el primero en opinar.</p>
        </div>

        <div v-if="isAuthenticated" class="review-form">
          <h3>Deja tu reseña</h3>
          <div class="star-rating">
            <span
              v-for="star in 5"
              :key="star"
              class="star"
              :class="{ filled: star <= newRating }"
              @click="newRating = star"
            >★</span>
          </div>
          <textarea
            v-model="newComment"
            placeholder="Compartí tu experiencia..."
            rows="3"
          ></textarea>
          <button @click="submitReview" :disabled="!newRating || !newComment.trim()" class="btn-submit-review">
            Publicar Reseña
          </button>
        </div>
        <div v-else class="review-login-cta">
          <p><router-link to="/login">Iniciá sesión</router-link> para dejar una reseña.</p>
        </div>
      </section>
    </div>
  </div>
  
  <div v-else-if="notFound" class="not-found-container">
    <h2>Propiedad no encontrada</h2>
    <p>La propiedad que buscás no existe o fue eliminada.</p>
    <router-link to="/buscar" class="btn btn-primary">
      Ver otras propiedades
    </router-link>
  </div>
  <div v-else class="loading-container">
    <div class="spinner"></div>
    <p>Cargando propiedad...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePropertyStore } from '@/stores/property'
import { useSEO, generatePropertySchema } from '@/composables/useSEO'
import { getPropertyReviews, addReview, getPropertyRating } from '@/services/reviews'
import { createReservation } from '@/services/reservations'
// isSupabaseConfigured removed — auth is now native JWT
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import { MapPin, Calendar, Star, Flame, Car, Clock, Phone, Mail, MessageSquare, Lock, Globe, ExternalLink, CheckCircle, ArrowRight, Send, X, ChevronLeft, ChevronRight, User } from '@lucide/vue'

const route = useRoute()
const authStore = useAuthStore()
const propertyStore = usePropertyStore()
const { updateMetaTags, addStructuredData } = useSEO()

// Estado
const property = ref(null)
const currentImage = ref('')
const notFound = ref(false)
const ownerProfile = ref(null)
const bookingDates = ref({
  checkIn: '',
  checkOut: '',
  guests: 2
})
const reviews = ref([])
const newRating = ref(0)
const newComment = ref('')
const showReservationModal = ref(false)
const submittingReservation = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const reservationForm = ref({
  checkIn: '',
  checkOut: '',
  guests: '',
  name: '',
  email: '',
  phone: '',
  message: ''
})

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const reservationNights = computed(() => {
  if (!reservationForm.value.checkIn || !reservationForm.value.checkOut) return 0
  const checkIn = new Date(reservationForm.value.checkIn)
  const checkOut = new Date(reservationForm.value.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const reservationTotal = computed(() => {
  if (property.value.rentalType === 'anual') {
    return property.value.pricing.basePrice
  }
  if (reservationNights.value <= 0) return 0
  const basePrice = property.value.pricing.basePrice * reservationNights.value
  const cleaningFee = property.value.pricing.cleaningFee || 0
  return basePrice + cleaningFee
})

const hasSocialMedia = computed(() => {
  if (!ownerProfile.value?.redesSociales) return false
  return ownerProfile.value.redesSociales.instagram ||
         ownerProfile.value.redesSociales.facebook ||
         ownerProfile.value.redesSociales.linkedin ||
         ownerProfile.value.redesSociales.website
})

// Computed
const nights = computed(() => {
  if (!bookingDates.value.checkIn || !bookingDates.value.checkOut) return 0
  const checkIn = new Date(bookingDates.value.checkIn)
  const checkOut = new Date(bookingDates.value.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const totalPrice = computed(() => {
  if (property.value.rentalType === 'anual') return property.value.pricing.basePrice
  if (nights.value <= 0) return 0
  const basePrice = property.value.pricing.basePrice * nights.value
  const cleaningFee = property.value.pricing.cleaningFee || 0
  return basePrice + cleaningFee
})

// Mock: Fechas reservadas (debería venir de la API)
const reservedDates = ref([
  '2025-11-18', '2025-11-19', '2025-11-20',
  '2025-11-25', '2025-11-26'
])

function isDateDisabled(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${day}`
  return reservedDates.value.includes(dateStr)
}

// Generar calendario del mes actual
const today = new Date()
const currentMonth = today.getMonth()
const currentYear = today.getFullYear()
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getMonthDays(year, month) {
  const days = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: dateStr,
      day: d,
      reserved: reservedDates.value.includes(dateStr)
    })
  }
  return days
}

const monthDays = getMonthDays(currentYear, currentMonth)
const calendarWeeks = []
let week = []
const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay() || 7
for (let i = 1; i < firstDayOfWeek; i++) {
  week.push({ date: '', day: '', reserved: false })
}
monthDays.forEach(day => {
  week.push(day)
  if (week.length === 7) {
    calendarWeeks.push(week)
    week = []
  }
})
if (week.length) {
  while (week.length < 7) week.push({ date: '', day: '', reserved: false })
  calendarWeeks.push(week)
}

// Tooltip para fechas reservadas
const tooltip = reactive({ visible: false, text: '', x: 0, y: 0 })
function showTooltip(day) {
  if (day.reserved) {
    tooltip.text = 'Fecha no disponible'
    tooltip.visible = true
    // Posición del mouse (simple)
    tooltip.x = window.event.clientX + 10
    tooltip.y = window.event.clientY - 10
  }
}
function hideTooltip() {
  tooltip.visible = false
}

// Métodos
const getWhatsAppLink = (phone, propertyTitle) => {
  // Limpiar el número de teléfono
  const cleanPhone = phone.replace(/[^0-9+]/g, '')
  // Mensaje pre-llenado
  const message = `Hola! Vi tu propiedad "${propertyTitle}" en AlquiLibres y me gustaría recibir más información.`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

const loadOwnerProfile = (ownerId) => {
  // Build the owner profile from the property fields returned by the API.
  ownerProfile.value = {
    displayName: property.value.ownerName || 'Propietario',
    email: property.value.ownerEmail || '',
    photoURL: property.value.ownerPhotoURL || '',
    city: property.value.location?.city || '',
    bio: '',
    contactoPrincipal: {
      telefono: property.value.ownerPhone || '',
      whatsapp: property.value.ownerPhone || '',
      email: property.value.ownerEmail || ''
    },
    contactoSecundario: { enabled: false },
    redesSociales: {}
  }
  return

  // Demo fallback (unused): try localStorage first, then fall back to a mock profile.
  const saved = localStorage.getItem(`profile_${ownerId}`)
  if (saved) {
    ownerProfile.value = JSON.parse(saved)
  } else {
    ownerProfile.value = {
      displayName: 'Juan Pérez',
      email: 'demo@alquilibres.com',
      photoURL: '',
      city: 'Villa Carlos Paz, Córdoba',
      bio: 'Soy propietario de varias propiedades en la zona. Me encanta recibir huéspedes y ayudarlos a tener una experiencia inolvidable.',
      contactoPrincipal: {
        telefono: '+54 351 123-4567',
        whatsapp: '+54 351 123-4567',
        email: 'contacto@ejemplo.com'
      },
      contactoSecundario: {
        enabled: true,
        descripcion: 'Administración',
        telefono: '+54 351 999-8888',
        whatsapp: '+54 351 999-8888',
        email: 'admin@ejemplo.com'
      },
      redesSociales: {
        instagram: 'alquileres_villacarlos',
        facebook: 'alquileres.vc',
        linkedin: '',
        website: 'https://www.ejemplo.com'
      }
    }
  }
}

const openReservationModal = () => {
  showReservationModal.value = true
  // Pre-llenar formulario si hay datos del usuario
  if (authStore.user) {
    reservationForm.value.name = authStore.user.displayName || ''
    reservationForm.value.email = authStore.user.email || ''
    // Sincronizar WhatsApp del perfil guardado en localStorage
    const savedProfile = localStorage.getItem(`profile_${authStore.user.uid}`)
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile)
      reservationForm.value.phone = parsedProfile.contactoPrincipal?.whatsapp || ''
    } else if (authStore.user.contactoPrincipal?.whatsapp) {
      reservationForm.value.phone = authStore.user.contactoPrincipal.whatsapp
    } else {
      reservationForm.value.phone = ''
    }
  }
  // Pre-llenar fechas del sidebar si están seleccionadas
  if (bookingDates.value.checkIn) {
    reservationForm.value.checkIn = bookingDates.value.checkIn
  }
  if (bookingDates.value.checkOut) {
    reservationForm.value.checkOut = bookingDates.value.checkOut
  }
  if (bookingDates.value.guests) {
    reservationForm.value.guests = bookingDates.value.guests
  }
}

const submitReservation = async () => {
  submittingReservation.value = true

  try {
    const reservationData = {
      propertyId: property.value.id,
      ownerId: property.value.ownerId,
      guestId: authStore.user?.uid || 'guest-' + Date.now(),
      property: {
        id: property.value.id,
        title: property.value.title,
        city: property.value.location?.city || '',
        image: property.value.images?.[0] || ''
      },
      guestName: reservationForm.value.name,
      guestEmail: reservationForm.value.email,
      guestPhone: reservationForm.value.phone,
      ownerName: ownerProfile.value?.displayName || '',
      ownerEmail: ownerProfile.value?.contactoPrincipal?.email || ownerProfile.value?.email || '',
      ownerPhone: ownerProfile.value?.contactoPrincipal?.whatsapp || ownerProfile.value?.contactoPrincipal?.telefono || '',
      checkIn: reservationForm.value.checkIn,
      checkOut: reservationForm.value.checkOut,
      nights: reservationNights.value,
      guests: parseInt(reservationForm.value.guests),
      basePrice: property.value.pricing?.basePrice ?? 0,
      cleaningFee: property.value.pricing?.cleaningFee || 0,
      total: reservationTotal.value,
      message: reservationForm.value.message || ''
    }

    const result = await createReservation(reservationData)

    if (!result.success) {
      throw new Error(result.error || 'Error al crear la reserva')
    }

    showReservationModal.value = false
    toastMessage.value = '¡Solicitud enviada! El propietario recibirá tu consulta por email y WhatsApp'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 5000)

    reservationForm.value = {
      checkIn: '',
      checkOut: '',
      guests: '',
      name: '',
      email: '',
      phone: '',
      message: ''
    }
  } catch (error) {
    console.error('Error enviando reserva:', error)
    toastMessage.value = (error.message || 'Error al enviar la solicitud. Por favor intenta nuevamente.')
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 5000)
  } finally {
    submittingReservation.value = false
  }
}

// Función para formatear fechas
const formatReservationDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  })
}

const submitReview = async () => {
  if (!newRating.value || !newComment.value.trim()) return
  await addReview({
    propertyId: property.value.id,
    guestName: authStore.user?.displayName || authStore.user?.email || 'Usuario',
    rating: newRating.value,
    comment: newComment.value.trim(),
    verified: true
  })
  reviews.value = await getPropertyReviews(property.value.id)
  newRating.value = 0
  newComment.value = ''
}

// Lifecycle
onMounted(async () => {
  const propertyId = route.params.id
  const result = await propertyStore.fetchProperty(undefined, propertyId)

  if (!result.success) {
    notFound.value = true
    return
  }

  property.value = result.data
  currentImage.value = property.value.images[0]

  // Cargar perfil del propietario
  loadOwnerProfile(property.value.ownerId || 'user123')

  // Actualizar meta tags SEO para esta propiedad
  updateMetaTags({
    title: `${property.value.title} | AlquiLibres`,
    description: property.value.description.substring(0, 160),
    url: `https://alquilibres.com/propiedad/${property.value.id}`,
    image: property.value.images[0] + '?w=1200&h=630&fit=crop',
    keywords: `${property.value.propertyType}, ${property.value.location.city}, alquiler ${property.value.rentalType || 'temporario'}, ${property.value.amenities.join(', ')}`,
    type: 'product'
  })

  // Agregar Schema.org structured data
  addStructuredData(generatePropertySchema(property.value))

  // Reseñas desde el servicio
  reviews.value = await getPropertyReviews(property.value.id)
  const ratingInfo = getPropertyRating(property.value.id)
  if (ratingInfo.count > 0) {
    property.value.rating = ratingInfo.rating
    property.value.reviewCount = ratingInfo.count
  }
})
</script>

<style scoped>
.property-detail {
  padding: var(--spacing-xl) 0;
}

.image-gallery {
  margin-bottom: var(--spacing-2xl);
}

.main-image {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-md);
}

.thumbnail-grid img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 3px solid transparent;
}

.thumbnail-grid img:hover,
.thumbnail-grid img.active {
  border-color: var(--primary-color);
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-2xl);
}

.property-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--spacing-xl);
}

.property-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-900);
}

.property-location {
  font-size: 1rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.rental-type-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.rental-type-badge.temporario {
  background: #dbeafe;
  color: #1e40af;
}

.rental-type-badge.anual {
  background: #fef3c7;
  color: #92400e;
}

.property-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--gray-600);
}

.property-rating {
  text-align: right;
}

.rating-value {
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.rating-count {
  display: block;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.detail-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.property-description {
  line-height: 1.8;
  color: var(--gray-700);
}

.highlight-section {
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 2px solid var(--secondary-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.feature-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.feature-icon {
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.amenity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.amenity-icon {
  color: var(--secondary-color);
  font-weight: 700;
  display: flex;
  align-items: center;
}

.calendar-placeholder {
  padding: var(--spacing-2xl);
  background-color: var(--gray-100);
  border-radius: var(--radius-md);
  text-align: center;
}

.calendar-placeholder p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.calendar-note {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: var(--spacing-sm);
}

.calendar-availability {
  margin-bottom: var(--spacing-xl);
}
.calendar-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--spacing-md);
}
.calendar-table th,
.calendar-table td {
  text-align: center;
  padding: 0.5rem;
}
.calendar-day {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--gray-100);
  color: var(--gray-900);
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.calendar-day.reserved {
  background: var(--gray-300);
  color: var(--gray-500);
  cursor: not-allowed;
}
.calendar-day:disabled {
  pointer-events: none;
}
.calendar-tooltip {
  position: fixed;
  background: var(--gray-900);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  z-index: 9999;
  pointer-events: none;
}

.booking-sidebar {
  padding: var(--spacing-xl);
  height: fit-content;
  position: sticky;
  top: 90px;
}

.pricing-info {
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--spacing-lg);
}

.price-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.price-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.price-period {
  font-size: 1rem;
  color: var(--gray-600);
}

.additional-fees {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.booking-form {
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.annual-notice {
  padding: var(--spacing-lg);
  background: #fef3c7;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  line-height: 1.6;
  color: #92400e;
  font-size: 0.875rem;
}

.annual-notice p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.price-breakdown {
  padding: var(--spacing-lg);
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.price-row.total {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--gray-300);
  margin-top: var(--spacing-md);
  font-size: 1.125rem;
}

.no-fees-notice {
  text-align: center;
  font-size: 0.875rem;
  color: var(--secondary-color);
  margin-top: var(--spacing-md);
  line-height: 1.6;
}

.no-fees-notice span {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.reviews-section {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-2xl);
  border-top: 1px solid var(--gray-200);
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.review-card {
  padding: var(--spacing-lg);
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.review-rating {
  color: var(--warning-color);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.review-date {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: var(--spacing-md);
}

.review-comment {
  color: var(--gray-700);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--secondary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}
.reviews-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--gray-500);
  background: white;
  border: 1px dashed var(--gray-300);
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}
.review-form {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}
.review-form h3 {
  color: var(--gray-800);
  margin-bottom: 0.75rem;
}
.star-rating {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}
.star {
  font-size: 1.5rem;
  color: var(--gray-300);
  cursor: pointer;
  transition: color 0.15s;
}
.star.filled {
  color: #f59e0b;
}
.star:hover {
  color: #fbbf24;
}
.review-form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
}
.review-form textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  ring: 2px solid var(--primary-200);
}
.btn-submit-review {
  padding: 0.625rem 1.25rem;
  background: var(--primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
}
.btn-submit-review:disabled {
  background: var(--gray-300);
  cursor: default;
}
.review-login-cta {
  margin-top: 1rem;
  text-align: center;
  color: var(--gray-500);
}
.review-login-cta a {
  color: var(--primary-600);
  font-weight: 500;
}

/* Contact Section */
.contact-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 2px solid #0ea5e9;
}

.owner-contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.owner-header {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-md);
}

.owner-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--primary-color);
  flex-shrink: 0;
}

.owner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  font-size: 2rem;
  font-weight: 700;
}

.owner-details h3 {
  font-size: 1.25rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.owner-location {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.owner-bio {
  color: var(--gray-700);
  line-height: 1.6;
  font-size: 0.875rem;
}

.contact-methods {
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-md);
}

.contact-methods h4 {
  font-size: 1rem;
  color: var(--gray-800);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.contact-methods.secondary {
  background: #fef3c7;
}

.contact-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.contact-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  flex: 1;
  min-width: 200px;
  justify-content: center;
}

.contact-btn.small {
  min-width: 150px;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
}

.contact-btn svg {
  width: 20px;
  height: 20px;
}

.contact-btn.whatsapp {
  background: #25d366;
  color: white;
}

.contact-btn.whatsapp:hover {
  background: #20ba5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
}

.contact-btn.phone {
  background: #3b82f6;
  color: white;
}

.contact-btn.phone:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.contact-btn.email {
  background: #8b5cf6;
  color: white;
}

.contact-btn.email:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.social-media {
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-md);
}

.social-media h4 {
  font-size: 1rem;
  color: var(--gray-800);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.social-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.social-link.instagram {
  background: #f3e8ff;
  color: #7c3aed;
}

.social-link.instagram:hover {
  background: #e9d5ff;
  transform: translateY(-2px);
}

.social-link.facebook {
  background: #dbeafe;
  color: #2563eb;
}

.social-link.facebook:hover {
  background: #bfdbfe;
  transform: translateY(-2px);
}

.social-link.linkedin {
  background: #dbeafe;
  color: #0284c7;
}

.social-link.linkedin:hover {
  background: #bfdbfe;
  transform: translateY(-2px);
}

.social-link.website {
  background: #f3f4f6;
  color: var(--gray-700);
}

.social-link.website:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

/* Contact Locked (Not Authenticated) */
.contact-locked {
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
}

.blur-overlay {
  text-align: center;
  max-width: 500px;
  z-index: 10;
}

.lock-icon {
  margin-bottom: var(--spacing-lg);
  animation: pulse 2s ease-in-out infinite;
  display: flex;
  justify-content: center;
  color: var(--gray-600);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.blur-overlay h3 {
  font-size: 1.5rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
}

.blur-overlay p {
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
}

.contact-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.preview-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(255,255,255,0.5);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--gray-500);
  filter: blur(2px);
}

.small-text {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: var(--spacing-md);
}

.small-text a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.small-text a:hover {
  text-decoration: underline;
}

/* Reservation Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.reservation-modal {
  max-width: 650px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 2px solid var(--gray-200);
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.modal-body {
  padding: var(--spacing-xl);
}

.reservation-summary {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xl);
}

.summary-image {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.reservation-summary h3 {
  font-size: 1.125rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.reservation-summary p {
  color: var(--gray-600);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.auth-required {
  text-align: center;
  padding: var(--spacing-2xl);
}

.auth-required p {
  margin-bottom: var(--spacing-lg);
  color: var(--gray-700);
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.label.required::after {
  content: ' *';
  color: #ef4444;
}

.input,
.textarea {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.help-text {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 4px;
}

.price-summary {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: var(--radius-md);
  border: 2px solid #0ea5e9;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  color: var(--gray-700);
}

.summary-row.total {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 2px solid #0ea5e9;
  font-size: 1.125rem;
  color: var(--gray-900);
}

.form-note {
  text-align: center;
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: -var(--spacing-sm);
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.125rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #10b981;
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  font-weight: 600;
  z-index: 10000;
  max-width: 500px;
}

.toast svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* DatePicker Styles */
.dp__input {
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-300);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 1rem;
  color: var(--gray-900);
  background: var(--gray-50);
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  display: block;
}
.dp__input:focus {
  border-color: var(--primary-color);
  outline: none;
}
.dp__input[readonly] {
  background: var(--gray-100);
  color: var(--gray-700);
}
.dp__cell--disabled {
  background: var(--gray-200) !important;
  color: var(--gray-500) !important;
  cursor: not-allowed !important;
}
.dp__cell--selected {
  background: var(--primary-color) !important;
  color: #fff !important;
  border-radius: 50%;
}
.dp__calendar {
  font-family: inherit;
}
.dp__input-icon {
  right: 1rem !important;
  left: auto !important;
}
.dp__input-wrap {
  width: 100%;
}
</style>
