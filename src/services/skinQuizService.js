/**
 * Skin Quiz Service - Kataraa
 * Logic for mapping user skin concerns to specific product types and routines.
 */

export const SKIN_QUESTIONS = [
    {
        id: 'skin_type',
        question: 'quizQuestionType', // Translation key
        options: [
            { id: 'oily', label: 'quizOptionOily', icon: 'water' },
            { id: 'dry', label: 'quizOptionDry', icon: 'leaf' },
            { id: 'combination', label: 'quizOptionCombination', icon: 'contrast' },
            { id: 'sensitive', label: 'quizOptionSensitive', icon: 'heart' },
        ]
    },
    {
        id: 'primary_concern',
        question: 'quizQuestionConcern',
        options: [
            { id: 'acne', label: 'quizOptionAcne', icon: 'bug' },
            { id: 'aging', label: 'quizOptionAging', icon: 'hourglass' },
            { id: 'pigmentation', label: 'quizOptionPigmentation', icon: 'color-palette' },
            { id: 'hydration', label: 'quizOptionHydration', icon: 'rainy' },
        ]
    },
    {
        id: 'age_group',
        question: 'quizQuestionAge',
        options: [
            { id: 'teens_20s', label: 'quizOptionTeens20s', icon: 'body' },
            { id: '30s_40s', label: 'quizOption30s40s', icon: 'person' },
            { id: '50s_plus', label: 'quizOption50plus', icon: 'star' },
        ]
    }
];

/**
 * Maps quiz results to internal search categories or keywords
 */
export const getRecommendations = (answers) => {
    const { skin_type, primary_concern, age_group } = answers;

    let query = '';
    let description = 'quizRoutineDescription'; // Default translation key

    // Logic Mapping
    if (primary_concern === 'acne') {
        query = 'acne'; // Will be used to search products
        description = 'quizRoutineAcne';
    } else if (primary_concern === 'aging') {
        query = 'anti-aging';
        description = 'quizRoutineAging';
    } else if (primary_concern === 'pigmentation') {
        query = 'brightening';
        description = 'quizRoutinePigmentation';
    } else {
        query = skin_type === 'dry' ? 'dry skin' : 'moisturizer';
        description = skin_type === 'dry' ? 'quizRoutineDry' : 'quizRoutineGeneral';
    }

    return {
        searchQuery: query,
        routineKey: description,
        skinType: skin_type,
    };
};
