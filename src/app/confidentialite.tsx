import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { RText } from '@/components/ui/r-text';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Ce que Ruella garde',
    body: 'Vos séjours, les étapes cochées, vos points et tampons, les prénoms et tranches d’âge des voyageurs, vos réglages. Tout est enregistré uniquement sur ce téléphone.',
  },
  {
    title: 'Votre position',
    body: 'Elle sert à afficher le point bleu sur la carte, à partir de votre position si vous le choisissez, et à valider une étape sur place si vous activez cette option. Elle n’est jamais envoyée à un serveur, ni à nous ni à personne.',
  },
  {
    title: 'Les enfants',
    body: 'Aucun compte enfant. Seule une tranche d’âge est notée, pour éviter de proposer des visites qui ne leur conviennent pas.',
  },
  {
    title: 'Aucune publicité, aucun pistage',
    body: 'Ruella ne contient ni publicité, ni outil de mesure d’audience, ni traceur. Aucune statistique d’usage n’est collectée.',
  },
  {
    title: 'Ce qui passe par Internet',
    body: 'Les photos des lieux (Wikimedia Commons) et les mises à jour de l’application. En touchant « Y aller », l’itinéraire s’ouvre dans Plans ou Google Maps, qui appliquent leur propre politique.',
  },
  {
    title: 'Vos droits',
    body: 'Profil › Exporter mes données vous remet tout ce que Ruella connaît de vous. Profil › Tout effacer supprime tout, définitivement. Supprimer l’application a le même effet.',
  },
  {
    title: 'Crédits',
    body: 'Fond de carte : © contributeurs OpenStreetMap (licence ODbL). Photos : Wikimedia Commons, auteur et licence indiqués sur chaque fiche. Données de lieux : Wikidata (CC0) et sites officiels cités dans les fiches.',
  },
];

export default function ConfidentialiteScreen() {
  const { colors } = useRuellaTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <RText variant="placeLarge" accessibilityRole="header">
          Confidentialité
        </RText>
        <RText muted>En bref : vos voyages restent chez vous.</RText>
        {SECTIONS.map((s) => (
          <View key={s.title} style={[styles.box, { backgroundColor: colors.surface }]}>
            <RText variant="heading">{s.title}</RText>
            <RText muted>{s.body}</RText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.l, gap: space.m, paddingBottom: 60 },
  box: { borderRadius: radius.card, padding: space.l, gap: space.s },
});
