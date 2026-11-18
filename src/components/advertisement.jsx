"use client"
import { api1, api2 } from "../baseUrl"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
//import { ArrowRight, X } from "lucide-react"
import { ArrowRight, X, Pause, Play, ExternalLink, Calendar, Ticket, Star } from "lucide-react"

// AdvertisementProps: { position: "banner" | "sidebar" | "footer" }
// AdAnimation: { type: string, duration: number, images: string[] }

// runtime API base and helpers (use real backend; no hardcoded mockAds)
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
const API_BASE = api1;

function normalizeUrl(url) {
	if (!url) return ""
	if (/^https?:\/\//i.test(url)) return url
	return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`
}

function parseAnimation(anim) {
	if (!anim) return { type: "fade", duration: 3500, images: [] }
	if (typeof anim === "string") {
		try {
			const parsed = JSON.parse(anim)
			return {
				type: parsed.type || "fade",
				duration: parsed.duration || 3500,
				images: Array.isArray(parsed.images) ? parsed.images : [],
			}
		} catch {
			return { type: anim || "fade", duration: 3500, images: [] }
		}
	}
	return {
		type: anim.type || "fade",
		duration: anim.duration || 3500,
		images: Array.isArray(anim.images) ? anim.images : [],
	}
}

// compute whether an ad should be active now (flag + date range)
function isActiveNow(isActiveFlag, startDate, endDate) {
	const now = new Date()
	if (!isActiveFlag) return false
	if (startDate && now < startDate) return false
	if (endDate && now > endDate) return false
	return true
}

// Animation Components
const AnimatedBackground = ({ animation = { type: "fade", duration: 3500, images: [] }, isActive, isPaused }) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
	const [animationPhase, setAnimationPhase] = useState(0)

	useEffect(() => {
		if (!isActive || isPaused) return
		if (!animation || !animation.images || animation.images.length === 0) return

		const interval = setInterval(
			() => {
				if (animation.type === "slideshow") {
					setCurrentImageIndex((prev) => (prev + 1) % animation.images.length)
				} else {
					setAnimationPhase((prev) => (prev + 1) % 100)
				}
			},
			animation.duration / (animation.type === "slideshow" ? Math.max(1, animation.images.length) : 100),
		)

		return () => clearInterval(interval)
	}, [animation, isActive, isPaused])

	const getAnimationStyle = () => {
		switch (animation.type) {
			case "slideshow":
				return {}
			case "zoom": {
				const zoomScale = 1 + Math.sin(animationPhase * 0.1) * 0.1
				return { transform: `scale(${zoomScale})` }
			}
			case "parallax": {
				const parallaxY = Math.sin(animationPhase * 0.05) * 10
				return { transform: `translateY(${parallaxY}px)` }
			}
			case "fade": {
				const opacity = 0.7 + Math.sin(animationPhase * 0.1) * 0.3
				return { opacity }
			}
			case "rotate": {
				const rotation = animationPhase * 0.5
				return { transform: `rotate(${rotation}deg) scale(1.05)` }
			}
			default:
				return {}
		}
	}

	if (!animation || !animation.images || animation.images.length === 0) {
		return null
	}

	if (animation.type === "slideshow") {
		return (
			<div className="absolute inset-0 overflow-hidden">
				{animation.images.map((image, index) => (
					<div
						key={index}
						className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-110"
							}`}
					>
						{/* image should be absolute URL */}
						<img
							src={image || "/placeholder.svg"}
							alt="Advertisement background"
							className="object-cover w-full h-full"
							loading={index === 0 ? "eager" : "lazy"}
						/>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className="absolute inset-0 overflow-hidden">
			<div className="absolute inset-0 transition-all duration-300 ease-out" style={getAnimationStyle()}>
				<img
					src={animation.images[currentImageIndex % animation.images.length] || "/placeholder.svg"}
					alt="Advertisement background"
					className="object-cover w-full h-full"
					loading="eager"
				/>
			</div>
		</div>
	)
}

// Floating particles animation
const FloatingParticles = ({ count = 20, color = "rgba(255, 255, 255, 0.3)" }) => {
	const particles = Array.from({ length: count }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		y: Math.random() * 100,
		size: Math.random() * 4 + 2,
		duration: Math.random() * 10 + 10,
		delay: Math.random() * 5,
	}))

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{particles.map((particle) => (
				<div
					key={particle.id}
					className="absolute rounded-full animate-float"
					style={{
						left: `${particle.x}%`,
						top: `${particle.y}%`,
						width: `${particle.size}px`,
						height: `${particle.size}px`,
						backgroundColor: color,
						animationDuration: `${particle.duration}s`,
						animationDelay: `${particle.delay}s`,
					}}
				/>
			))}
		</div>
	)
}

// Pulse animation component
const PulseOverlay = ({ isActive }) => {
	return (
		<div className={`absolute inset-0 pointer-events-none ${isActive ? "animate-pulse-slow" : ""}`}>
			<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
		</div>
	)
}

export function Advertisement({ position }) {
	const { t, i18n } = useTranslation()
	const [currentAd, setCurrentAd] = useState(0)
	const [isVisible, setIsVisible] = useState(true)
	const [isHovered, setIsHovered] = useState(false)
	const [isPaused, setIsPaused] = useState(false)
	const [isAnimationActive, setIsAnimationActive] = useState(true)

	// fetched ads state (always declare hooks in same order)
	const [adsData, setAdsData] = useState([])
	const [loadingAds, setLoadingAds] = useState(true)
	const [adsError, setAdsError] = useState(null)

	// fetch ads from backend once
	useEffect(() => {
		let mounted = true
		async function loadAds() {
			setLoadingAds(true)
			setAdsError(null)
			try {
				const res = await fetch(`${api1}/ads`)
				if (!res.ok) throw new Error(`Failed to fetch ads (${res.status})`)
				const data = await res.json()
				const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : [])
				// optional mapping of backend position values -> expected values
				const positionMap = {
					absolute: "sidebar", // map backend "absolute" -> "sidebar"
				}
				const normalized = list.map((ad) => {
					const animation = parseAnimation(ad.animation)
					const imageUrl = normalizeUrl(ad.image_url ?? ad.imageUrl ?? ad.image ?? "")
					// ensure animation images are absolute and fallback to main image
					let animImages = (animation.images || []).map(normalizeUrl).filter(Boolean)
					if (animImages.length === 0 && imageUrl) animImages = [imageUrl]

					const startDate = ad.start_date ? new Date(ad.start_date) : null
					const endDate = ad.end_date ? new Date(ad.end_date) : null
					const baseActive = ad.is_active === 1 || ad.is_active === true || ad.isActive === true

					return {
						id: String(ad.ad_id ?? ad.id ?? ""),
						title: ad.title ?? "",
						titleAm: ad.title_am ?? ad.titleAm ?? "",
						imageUrl,
						linkUrl: ad.link_url ?? ad.linkUrl ?? ad.link ?? "#",
						position: positionMap[ad.position] ?? ad.position ?? "banner",
						// compute active state: backend flag AND within date range
						isActive: isActiveNow(baseActive, startDate, endDate),
						description: ad.description ?? "",
						descriptionAm: ad.description_am ?? ad.descriptionAm ?? "",
						startDate,
						endDate,
						category: ad.category ?? "",
						discount: ad.discount ?? "",
						animation: {
							type: animation.type || "fade",
							duration: animation.duration || 3500,
							images: animImages,
						},
					}
				})
				if (mounted) setAdsData(normalized)
			} catch (err) {
				console.error("Advertisement: failed to load ads", err)
				if (mounted) {
					setAdsData([])
					setAdsError(err)
				}
			} finally {
				if (mounted) setLoadingAds(false)
			}
		}
		loadAds()
		return () => {
			mounted = false
		}
	}, [])

	// rotate ads
	useEffect(() => {
		if (adsData.length > 1) {
			const interval = setInterval(() => {
				if (!isHovered && !isPaused) {
					setCurrentAd((prev) => (prev + 1) % adsData.length)
				}
			}, 8000)
			return () => clearInterval(interval)
		}
	}, [adsData.length, isHovered, isPaused])

	// Intersection Observer for performance optimization
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsAnimationActive(entry.isIntersecting)
			},
			{ threshold: 0.1 },
		)

		const element = document.getElementById(`ad-${position}`)
		if (element) {
			observer.observe(element)
		}

		return () => {
			if (element) {
				observer.unobserve(element)
			}
		}
	}, [position])

	// Derive ads for this position
	const ads = (adsData || []).filter((ad) => ad.position === position && ad.isActive)

	// show nothing if still loading or no ads available or hidden
	if (loadingAds) return null
	if (!ads.length || !isVisible) return null

	const ad = ads[Math.min(currentAd, Math.max(0, ads.length - 1))]

	const getBadgeColor = (category) => {
		switch (category) {
			case "exhibition":
				return "bg-yellow-600"
			case "service":
				return "bg-orange-600"
			case "education":
				return "bg-green-600"
			case "workshop":
				return "bg-purple-600"
			case "special":
				return "bg-red-600"
			default:
				return "bg-gray-600"
		}
	}

	const toggleAnimation = () => {
		setIsPaused(!isPaused)
	}

	if (position === "banner") {
		return (
			<div
				id={`ad-${position}`}
				className="relative bg-gradient-to-r from-yellow-600 to-orange-600 text-white overflow-hidden min-h-[200px] transition-all duration-1000 ease-in-out"
			>
				{/* Animated Background */}
				<AnimatedBackground animation={ad.animation} isActive={isAnimationActive} isPaused={isPaused} />

				{/* Floating Particles */}
				<FloatingParticles count={15} color="rgba(255, 255, 255, 0.2)" />

				{/* Pulse Overlay */}
				<PulseOverlay isActive={isAnimationActive && !isPaused} />

				{/* Dark Overlay */}
				<div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>

				<div
					className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10 transition-all duration-500"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-8">
							<div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 group shadow-2xl">
								<div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10"></div>
								<img
									src={ad.imageUrl || "/placeholder.svg"}
									alt={ad.title}
									className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1 w-full h-full"
								/>
								<div className="absolute inset-0 animate-border-glow"></div>
							</div>

							<div className="flex-1 space-y-4">
								<div className="flex items-center space-x-4 flex-wrap">
									<Badge className={`text-white ${getBadgeColor(ad.category)} animate-pulse shadow-lg`}>
										{ad.category.toUpperCase()}
									</Badge>
									<Badge
										variant="secondary"
										className="bg-white/20 text-white border-white/30 backdrop-blur-sm animate-bounce-slow"
									>
										{ad.discount}
									</Badge>
									<Badge
										variant="secondary"
										className="bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse"
									>
										✨ FEATURED
									</Badge>
								</div>

								<h3 className="text-2xl md:text-3xl font-bold mb-2 transition-all duration-300 hover:text-yellow-200 animate-text-glow">
									{i18n.language === 'am' ? (ad.titleAm || ad.title) : ad.title}
								</h3>

								<p className="text-white/90 text-lg leading-relaxed transition-all duration-300 hover:text-white">
									{i18n.language === 'am' ? (ad.descriptionAm || ad.description) : ad.description}
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleAnimation}
								className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 rounded-full p-3"
								title={isPaused ? "Resume Animation" : "Pause Animation"}
							>
								{isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
							</Button>

							{ad.linkUrl && (<Button
								asChild
								variant="secondary"
								className="bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl px-6 py-3 font-semibold"
							>
								<Link to={ad.linkUrl}>
									<ExternalLink className="h-5 w-5 mr-2" />
									{t("ad.learnMore")}
								</Link>
							</Button>)}

							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsVisible(false)}
								className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 rounded-full p-3"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</div>

					{/* Enhanced Progress indicators */}
					{ads.length > 1 && (
						<div className="flex justify-center mt-8 space-x-3">
							{ads.map((_, index) => (
								<button
									key={index}
									className={`relative transition-all duration-500 hover:scale-125 ${index === currentAd
										? "w-8 h-3 bg-white shadow-lg rounded-full"
										: "w-3 h-3 bg-white/50 hover:bg-white/70 rounded-full"
										}`}
									onClick={() => setCurrentAd(index)}
								>
									{index === currentAd && (
										<div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
									)}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		)
	}

	if (position === "sidebar") {
		return (
			<div
				id={`ad-${position}`}
				className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 w-80 transition-all duration-500 ease-in-out"
			>
				<Card
					className="overflow-hidden shadow-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-3xl"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className="relative h-48 overflow-hidden">
						{/* Animated Background */}
						<AnimatedBackground animation={ad.animation} isActive={isAnimationActive} isPaused={isPaused} />

						{/* Floating Particles */}
						<FloatingParticles count={8} color="rgba(255, 255, 255, 0.4)" />

						{/* Gradient Overlay */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

						{/* Animated Border */}
						<div className="absolute inset-0 animate-border-pulse"></div>

						{/* Controls */}
						<div className="absolute top-3 left-3 flex space-x-2 z-20">
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleAnimation}
								className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300 hover:scale-110"
							>
								{isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
							</Button>
						</div>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsVisible(false)}
							className="absolute top-3 right-3 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 rounded-full p-2 z-20"
						>
							<X className="h-4 w-4" />
						</Button>

						<Badge
							className={`absolute bottom-3 left-3 text-white ${getBadgeColor(ad.category)} animate-pulse shadow-lg z-20`}
						>
							{ad.category.toUpperCase()}
						</Badge>
					</div>

					<CardContent className="p-6 relative">
						{/* Background Animation */}
						<div className="absolute inset-0 bg-gradient-to-br from-transparent via-yellow-50/50 to-orange-50/50 animate-gradient-shift"></div>

						<div className="relative z-10">
							<div className="flex items-center justify-between mb-3">
								<Badge variant="secondary" className="bg-yellow-600 text-white animate-bounce-slow shadow-lg">
									{ad.discount}
								</Badge>
								<div className="flex items-center text-yellow-600">
									<Star className="h-4 w-4 mr-1 fill-current animate-spin-slow" />
									<span className="text-sm font-medium">Featured</span>
								</div>
							</div>

							<h3 className="font-bold text-gray-900 mb-3 line-clamp-2 transition-colors duration-300 hover:text-yellow-600 text-lg">
								{i18n.language === 'am' ? (ad.titleAm || ad.title) : ad.title}
							</h3>

							<p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
								{i18n.language === 'am' ? (ad.descriptionAm || ad.description) : ad.description}
							</p>

							<Button
								asChild
								className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-white font-semibold py-3"
							>
								<Link to={ad.linkUrl}>
									<Calendar className="h-4 w-4 mr-2" />
									{t("ad.bookNow")}
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (position === "footer") {
		return (
			<div
				id={`ad-${position}`}
				className="relative bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-8 overflow-hidden transition-all duration-1000 ease-in-out"
			>
				{/* Animated Background */}
				<div className="absolute inset-0 opacity-30">
					<AnimatedBackground animation={ad.animation} isActive={isAnimationActive} isPaused={isPaused} />
				</div>

				{/* Floating Particles */}
				<FloatingParticles count={12} color="rgba(255, 255, 255, 0.3)" />

				{/* Animated Waves */}
				<div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/20 to-transparent">
					<div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-wave"></div>
				</div>

				<div
					className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-6">
							<div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 group shadow-xl">
								<div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10"></div>
								<img
									src={ad.imageUrl || "/placeholder.svg"}
									alt={ad.title}
									className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1 w-full h-full"
								/>
								<div className="absolute inset-0 animate-pulse-ring"></div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center space-x-3 flex-wrap">
									<Badge className={`text-white ${getBadgeColor(ad.category)} animate-pulse shadow-lg`}>
										{ad.category.toUpperCase()}
									</Badge>
									<Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm animate-bounce-slow">
										{ad.discount}
									</Badge>
									<Badge
										variant="secondary"
										className="bg-gradient-to-r from-green-500 to-blue-500 text-white animate-pulse"
									>
										🎯 TRENDING
									</Badge>
								</div>

								<h3 className="font-bold text-xl transition-colors duration-300 hover:text-yellow-200 animate-text-glow">
									{i18n.language === 'am' ? (ad.titleAm || ad.title) : ad.title}
								</h3>

								<p className="text-white/90 text-sm leading-relaxed">
									{i18n.language === 'am' ? (ad.descriptionAm || ad.description) : ad.description}
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleAnimation}
								className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 rounded-full p-3"
							>
								{isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
							</Button>

							{ad.linkUrl && (<Button
								asChild
								variant="secondary"
								className="bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl px-6 py-3 font-semibold"
							>
								<Link href={ad.linkUrl}>
									<Ticket className="h-4 w-4 mr-2" />
									{t("ad.getStarted")}
								</Link>
							</Button>)}

							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsVisible(false)}
								className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 rounded-full p-3"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return null
}

export default Advertisement

