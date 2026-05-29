import { StyleSheet } from 'react-native';

export const colors = {
    background: '#ffff',
    backgroundSecondary: '#f0f0f5',
    header: '#242444',
    surface: '#c7c7d4',
    primary: '#32bbfa',
    text: '#000000',
    textSurface: '#fff',
    textSecondary: '#363641',
    alert: '#ff5252',
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 30,
        marginBottom: 16,
    },
    empty: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    link: {
        color: colors.textSurface,
        fontSize: 18,
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderRadius: 5,
        textAlign: 'center',
        fontWeight: '600',
    }
});