import os, cv2, random
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (Input, Conv2D, MaxPooling2D, BatchNormalization,
        GlobalAveragePooling2D, Dense, Dropout)
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import StratifiedShuffleSplit
from collections import Counter


# ========== CONFIG ==========
train_dir = "Vitamin_dataset/train"
test_dir = "Vitamin_dataset/test"
BATCH_SIZE = 16
EPOCHS = 20
TARGET_SIZE_RANGE = (200, 400)

# ========== DATA LOADER ==========
def load_images_variable_size(directory, target_size_range=(200, 400)):
    images, labels = [], []
    class_names = sorted([x for x in os.listdir(directory) if os.path.isdir(os.path.join(directory, x))])
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}
    for class_name in class_names:
        class_path = os.path.join(directory, class_name)
        for img_name in os.listdir(class_path):
            img_path = os.path.join(class_path, img_name)
            try:
                img = cv2.imread(img_path)
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                h, w = img.shape[:2]
                min_dim = min(h, w)
                scale = target_size_range[0] / min_dim if min_dim < target_size_range[0] else \
                        target_size_range[1] / min_dim if min_dim > target_size_range[1] else 1.0
                img = cv2.resize(img, (int(w * scale), int(h * scale)))
                img = img.astype('float32') / 255.0
                images.append(img)
                labels.append(class_to_idx[class_name])
            except Exception as e:
                print(f"Error loading {img_path}: {e}")
    return images, labels, class_names, class_to_idx

# ========== DATA GENERATOR ==========
class VariableSizeDataGenerator(tf.keras.utils.Sequence):
    def __init__(self, images, labels, batch_size, augment=False):
        self.images = images
        self.labels = to_categorical(labels)
        self.batch_size = batch_size
        self.augment = augment
        self.indices = np.arange(len(images))
        self.target_height = 400
        self.target_width = 400

    def __len__(self):
        return int(np.ceil(len(self.images) / self.batch_size))

    def __getitem__(self, idx):
        batch_idx = self.indices[idx * self.batch_size:(idx + 1) * self.batch_size]
        batch_x = [self.images[i] for i in batch_idx]
        batch_y = [self.labels[i] for i in batch_idx]

        resized_x = []
        for img in batch_x:
            h, w = img.shape[:2]
            scale = min(self.target_height / h, self.target_width / w)
            new_h, new_w = int(h * scale), int(w * scale)
            img_resized = cv2.resize(img, (new_w, new_h))

            pad_h = self.target_height - new_h
            pad_w = self.target_width - new_w
            img_padded = np.pad(
                img_resized,
                ((0, pad_h), (0, pad_w), (0, 0)),
                mode='constant'
            )
            resized_x.append(img_padded)

        return np.array(resized_x), np.array(batch_y)

# ========== MODEL ==========
def build_alexnet_variable_size(num_classes):
    inputs = Input(shape=(None, None, 3))
    x = Conv2D(96, (11, 11), strides=4, activation='relu', padding='same')(inputs)
    x = BatchNormalization()(x)
    x = MaxPooling2D((3, 3), strides=2)(x)
    x = Conv2D(256, (5, 5), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((3, 3), strides=2)(x)
    x = Conv2D(384, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = Conv2D(384, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = Conv2D(256, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((3, 3), strides=2)(x)
    x = GlobalAveragePooling2D()(x)
    x = Dense(4096, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(4096, activation='relu')(x)
    x = Dropout(0.5)(x)
    outputs = Dense(num_classes, activation='softmax')(x)
    return Model(inputs, outputs)

# ========== LOAD DATA ==========
print("Loading training data...")
train_images, train_labels, class_names, class_to_idx = load_images_variable_size(train_dir, TARGET_SIZE_RANGE)
print("Loading testing data...")
test_images, test_labels, _, _ = load_images_variable_size(test_dir, TARGET_SIZE_RANGE)


def summarize_class_distribution(images, labels, class_names, split_name):
    counts = Counter(labels)
    print(f"\n{split_name} Class Distribution:")
    for idx, name in enumerate(class_names):
        print(f"  {name}: {counts[idx]} images")

summarize_class_distribution(train_images, train_labels, class_names, "Training")


# Get indices only — no need to convert images to NumPy
sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
for train_idx, val_idx in sss.split(train_images, train_labels):
    train_images_split = [train_images[i] for i in train_idx]
    train_labels_split = [train_labels[i] for i in train_idx]
    val_images = [train_images[i] for i in val_idx]
    val_labels = [train_labels[i] for i in val_idx]

train_images = train_images_split
train_labels = train_labels_split

sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
for train_idx, val_idx in sss.split(train_images, train_labels):
    train_images_split = [train_images[i] for i in train_idx]
    train_labels_split = [train_labels[i] for i in train_idx]
    val_images = [train_images[i] for i in val_idx]
    val_labels = [train_labels[i] for i in val_idx]

train_images = train_images_split
train_labels = train_labels_split


NUM_CLASSES = len(class_names)
train_gen = VariableSizeDataGenerator(train_images, train_labels, BATCH_SIZE, augment=True)
val_gen = VariableSizeDataGenerator(val_images, val_labels, BATCH_SIZE)
test_gen = VariableSizeDataGenerator(test_images, test_labels, BATCH_SIZE)

def predict_any_size(image_path, model, class_names):
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        original = img.copy()
        img = img.astype('float32') / 255.0
        img = np.expand_dims(img, axis=0)
        preds = model.predict(img, verbose=0)[0]
        idx = np.argmax(preds)
        confidence = preds[idx]
        predicted_class = class_names[idx]

        # Optional: map class names to readable labels
        label_map = {
            "vitamin_A": "Vitamin A",
            "vitamin_B": "Vitamin B",
            "vitamin_C": "Vitamin C",
            "vitamin_D": "Vitamin D",
            "vitamin_E": "Vitamin E",
            "iron": "Iron",
            "Zinc": "Zinc",
            "normal": "Normal"
        }
        readable = label_map.get(predicted_class, predicted_class)

        # Diagnosis sentence
        if readable == "Normal":
            diagnosis = "Your eyes appear normal — no deficiency detected."
        else:
            diagnosis = f"You have {readable} deficiency."

        print(f"\nImage size: {original.shape[:2]}")
        print(f"Predicted Class: {predicted_class}")
        print(f"Confidence: {confidence*100:.2f}%")
        print(f"Diagnosis: {diagnosis}")

        plt.imshow(original)
        plt.title(f"{diagnosis} ({confidence*100:.2f}%)")
        plt.axis('off')
        plt.show()

        return predicted_class, confidence, diagnosis


if __name__ == "__main__":

    # ========== COMPILE & TRAIN ==========
    model = build_alexnet_variable_size(NUM_CLASSES)
    model.compile(optimizer=Adam(1e-4), loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])
    callbacks = [
        EarlyStopping(patience=10, restore_best_weights=True),
        ModelCheckpoint('best_alexnet_varsize.h5', save_best_only=True, monitor='val_accuracy'),
        ReduceLROnPlateau(patience=5, factor=0.5, min_lr=1e-7)
    ]
    model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS, callbacks=callbacks, verbose=1)

    # ========== EVALUATE ==========
    y_pred, y_true = [], []
    for i in range(len(test_gen)):
        x, y = test_gen[i]
        preds = model.predict(x, verbose=0)
        y_pred.extend(np.argmax(preds, axis=1))
        y_true.extend(np.argmax(y, axis=1))

    print(f"\nTest Accuracy: {np.mean(np.array(y_pred) == np.array(y_true)) * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_true, y_pred, target_names=class_names))
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.show()

    # ========== PREDICT NEW ==========
