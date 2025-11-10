import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';

interface UserProfileFormProps {
  onSave?: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSave }) => {
  const { user, updateUserAttribute } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    telephone: user?.telephone || '',
    localisation: user?.localisation || '',
    description: user?.description || '',
    photo_profil: user?.photo_profil || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const updates = [];
      
      for (const [key, value] of Object.entries(formData)) {
        if (user?.[key as keyof typeof user] !== value) {
          const success = await updateUserAttribute(key, value);
          if (success) {
            updates.push(key);
          }
        }
      }
      
      if (updates.length > 0) {
        Alert.alert('Succès', 'Profil mis à jour avec succès !');
        onSave?.();
      } else {
        Alert.alert('Info', 'Aucune modification détectée.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la mise à jour du profil.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Informations personnelles</Text>
      
      <View style={styles.form}>
        <Input
          label="Prénom"
          value={formData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
          placeholder="Votre prénom"
          style={styles.input}
        />
        
        <Input
          label="Nom"
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholder="Votre nom"
          style={styles.input}
        />
        
        <Input
          label="Nom d'utilisateur"
          value={formData.username}
          onChangeText={(value) => updateField('username', value)}
          placeholder="Votre nom d'utilisateur"
          style={styles.input}
        />
        
        <Input
          label="Téléphone"
          value={formData.telephone}
          onChangeText={(value) => updateField('telephone', value)}
          placeholder="06 12 34 56 78"
          keyboardType="phone-pad"
          style={styles.input}
        />
        
        <Input
          label="Localisation"
          value={formData.localisation}
          onChangeText={(value) => updateField('localisation', value)}
          placeholder="Paris, France"
          style={styles.input}
        />
        
        <Input
          label="Photo de profil (URL)"
          value={formData.photo_profil}
          onChangeText={(value) => updateField('photo_profil', value)}
          placeholder="https://exemple.com/photo.jpg"
          style={styles.input}
        />
        
        <Textarea
          label="Description"
          value={formData.description}
          onChangeText={(value) => updateField('description', value)}
          placeholder="Parlez-nous de vous..."
          numberOfLines={4}
          style={styles.textarea}
        />
        
        <Button
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButton}
        >
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  textarea: {
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
});
