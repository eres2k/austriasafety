// src/utils/gamification.ts
import type { User, Badge } from '@/types'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'milestone' | 'achievement' | 'special'
  criteria: AchievementCriteria
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface AchievementCriteria {
  type: 'inspection_count' | 'perfect_score' | 'streak' | 'speed' | 'finding_count' | 'collaboration'
  value: number
  additionalConditions?: Record<string, any>
}

export interface LevelInfo {
  level: number
  title: string
  minPoints: number
  maxPoints: number
  perks: string[]
}

// Achievement definitions
export const achievements: Achievement[] = [
  {
    id: 'first-inspection',
    name: 'Erste Schritte',
    description: 'Führen Sie Ihre erste Inspektion durch',
    icon: '🎯',
    category: 'milestone',
    criteria: { type: 'inspection_count', value: 1 },
    points: 10,
    rarity: 'common'
  },
  {
    id: 'safety-champion',
    name: 'Sicherheitschampion',
    description: 'Schließen Sie 50 Inspektionen ab',
    icon: '🏆',
    category: 'milestone',
    criteria: { type: 'inspection_count', value: 50 },
    points: 100,
    rarity: 'rare'
  },
  {
    id: 'perfect-score',
    name: 'Perfektionist',
    description: 'Erreichen Sie 100% bei einer Inspektion',
    icon: '⭐',
    category: 'achievement',
    criteria: { type: 'perfect_score', value: 100 },
    points: 25,
    rarity: 'rare'
  },
  {
    id: 'eagle-eye',
    name: 'Adlerauge',
    description: 'Finden Sie 100 Sicherheitsmängel',
    icon: '🦅',
    category: 'achievement',
    criteria: { type: 'finding_count', value: 100 },
    points: 75,
    rarity: 'epic'
  },
  {
    id: 'speed-demon',
    name: 'Blitzschnell',
    description: 'Schließen Sie eine vollständige Inspektion in unter 15 Minuten ab',
    icon: '⚡',
    category: 'achievement',
    criteria: { 
      type: 'speed', 
      value: 15,
      additionalConditions: { minQuestions: 20 }
    },
    points: 30,
    rarity: 'rare'
  },
  {
    id: 'week-warrior',
    name: 'Wochenkrieger',
    description: '7 Tage Inspektions-Streak',
    icon: '🔥',
    category: 'achievement',
    criteria: { type: 'streak', value: 7 },
    points: 40,
    rarity: 'rare'
  },
  {
    id: 'month-master',
    name: 'Monatsmeister',
    description: '30 Tage Inspektions-Streak',
    icon: '💎',
    category: 'achievement',
    criteria: { type: 'streak', value: 30 },
    points: 150,
    rarity: 'legendary'
  },
  {
    id: 'team-player',
    name: 'Teamplayer',
    description: 'Arbeiten Sie an 10 gemeinsamen Inspektionen',
    icon: '🤝',
    category: 'achievement',
    criteria: { type: 'collaboration', value: 10 },
    points: 50,
    rarity: 'epic'
  },
  {
    id: 'night-owl',
    name: 'Nachteule',
    description: 'Führen Sie eine Inspektion zwischen 22:00 und 06:00 Uhr durch',
    icon: '🦉',
    category: 'special',
    criteria: { 
      type: 'inspection_count', 
      value: 1,
      additionalConditions: { timeRange: { start: 22, end: 6 } }
    },
    points: 20,
    rarity: 'rare'
  },
  {
    id: 'all-locations',
    name: 'Weltenbummler',
    description: 'Führen Sie Inspektionen an allen 5 Standorten durch',
    icon: '🌍',
    category: 'special',
    criteria: { 
      type: 'inspection_count', 
      value: 5,
      additionalConditions: { uniqueLocations: ['DVI1', 'DVI2', 'DVI3', 'DAP5', 'DAP8'] }
    },
    points: 60,
    rarity: 'epic'
  }
]

// Level definitions
export const levels: LevelInfo[] = [
  {
    level: 1,
    title: 'Sicherheitsnovize',
    minPoints: 0,
    maxPoints: 99,
    perks: ['Basis-Inspektionen']
  },
  {
    level: 2,
    title: 'Sicherheitsassistent',
    minPoints: 100,
    maxPoints: 249,
    perks: ['Erweiterte Filteroptionen', 'Sprachnotizen']
  },
  {
    level: 3,
    title: 'Sicherheitsspezialist',
    minPoints: 250,
    maxPoints: 499,
    perks: ['KI-Analysen', 'Batch-Operationen']
  },
  {
    level: 4,
    title: 'Sicherheitsexperte',
    minPoints: 500,
    maxPoints: 999,
    perks: ['Erweiterte Statistiken', 'Vorlagen erstellen']
  },
  {
    level: 5,
    title: 'Sicherheitsmeister',
    minPoints: 1000,
    maxPoints: 1999,
    perks: ['Alle Features', 'Mentoring-Zugang']
  },
  {
    level: 6,
    title: 'Sicherheitslegende',
    minPoints: 2000,
    maxPoints: 99999,
    perks: ['Legendärer Status', 'Exklusive Features']
  }
]

export class GamificationEngine {
  private userStats: any
  private earnedBadges: Badge[]

  constructor(userStats: any) {
    this.userStats = userStats
    this.earnedBadges = userStats.badges || []
  }

  checkAchievements(context: any): Achievement[] {
    const newAchievements: Achievement[] = []

    achievements.forEach(achievement => {
      if (!this.hasAchievement(achievement.id)) {
        if (this.checkCriteria(achievement.criteria, context)) {
          newAchievements.push(achievement)
        }
      }
    })

    return newAchievements
  }

  private hasAchievement(achievementId: string): boolean {
    return this.earnedBadges.some(badge => badge.id === achievementId)
  }

  private checkCriteria(criteria: AchievementCriteria, context: any): boolean {
    switch (criteria.type) {
      case 'inspection_count':
        return this.userStats.totalInspections >= criteria.value

      case 'perfect_score':
        return context.score === criteria.value

      case 'streak':
        return this.userStats.streak >= criteria.value

      case 'speed':
        return context.duration && context.duration <= criteria.value * 60

      case 'finding_count':
        return context.totalFindings >= criteria.value

      case 'collaboration':
        return context.collaborations >= criteria.value

      default:
        return false
    }
  }

  getCurrentLevel(): LevelInfo {
    const totalPoints = this.calculateTotalPoints()
    return levels.find(level => 
      totalPoints >= level.minPoints && totalPoints <= level.maxPoints
    ) || levels[0]
  }

  getProgressToNextLevel(): number {
    const totalPoints = this.calculateTotalPoints()
    const currentLevel = this.getCurrentLevel()
    
    if (currentLevel.level === levels.length) {
      return 100 // Max level reached
    }

    const pointsInLevel = totalPoints - currentLevel.minPoints
    const levelRange = currentLevel.maxPoints - currentLevel.minPoints + 1
    
    return Math.round((pointsInLevel / levelRange) * 100)
  }

  calculateTotalPoints(): number {
    return this.earnedBadges.reduce((total, badge) => {
      const achievement = achievements.find(a => a.id === badge.id)
      return total + (achievement?.points || 0)
    }, 0)
  }

  getLeaderboardScore(): number {
    const points = this.calculateTotalPoints()
    const inspectionBonus = this.userStats.totalInspections * 2
    const streakBonus = this.userStats.streak * 5
    const perfectScoreBonus = this.userStats.perfectScores * 10

    return points + inspectionBonus + streakBonus + perfectScoreBonus
  }
}

// Animation effects for achievements
export function createAchievementAnimation(achievement: Achievement): void {
  // Create floating notification
  const notification = document.createElement('div')
  notification.className = 'achievement-notification'
  notification.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-content">
      <div class="achievement-title">Achievement Unlocked!</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-points">+${achievement.points} Points</div>
    </div>
  `
  
  document.body.appendChild(notification)
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show')
  }, 100)
  
  // Remove after animation
  setTimeout(() => {
    notification.classList.add('hide')
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 500)
  }, 5000)
}

// CSS for achievement notifications (add to global styles)
export const achievementStyles = `
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #FF9500 0%, #F59E0B 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
  transform: translateX(400px);
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 9999;
}

.achievement-notification.show {
  transform: translateX(0);
}

.achievement-notification.hide {
  transform: translateX(400px);
  opacity: 0;
}

.achievement-icon {
  font-size: 48px;
  animation: bounce 1s infinite;
}

.achievement-content {
  flex: 1;
}

.achievement-title {
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.achievement-name {
  font-size: 18px;
  font-weight: bold;
  margin: 4px 0;
}

.achievement-points {
  font-size: 14px;
  opacity: 0.9;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
`
