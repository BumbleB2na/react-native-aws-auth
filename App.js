import React from 'react';
import { StyleSheet, Button, Text, TextInput, View, ScrollView } from 'react-native';

export default class App extends React.Component {
	state = {
		title: '',
		url: ''
	};
	onChangeText = (key, val) => {
		this.setState({ [key]: val });
	};
	onPressSaveForLaterButton = () => {
		alert('Triggered Save For Later Button');
	};
	setFocusToHyperlinkInput = () => {
		this.hyperlinkInput.focus();
	};
	render() {
		return (
			<View style={styles.wrapper}>
				<View style={styles.footer}>
					<Text style={styles.title}>Save For Later</Text>
					<Text style={styles.subtitle}>What do you want to read, watch or listen to?</Text>
					<TextInput
						style={styles.input}
						value={this.state.title}
						onChangeText={val => this.onChangeText('title', val)}
						onSubmitEditing={this.setFocusToHyperlinkInput}
						placeholder="Title (optional)"
					/>
					<TextInput
						ref={(input) => { this.hyperlinkInput = input; }}
						style={styles.input}
						value={this.state.hyperlink}
						onChangeText={val => this.onChangeText('author', val)}
						onSubmitEditing={this.onPressSaveForLaterButton}
						placeholder="https://"
					/>
					<Button
						ref={(button) => { this.saveForLaterButton = button; }}
						onPress={this.onPressSaveForLaterButton}
						title="Save For Later"
						accessibilityLabel="Save Your Hyperlink For Later"
						color="#eeaa55"
					/>
				</View>
				<ScrollView style={styles.list}>
					<Text style={styles.title}>Your Saves For Later</Text>
				</ScrollView>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1
	},
	list: {
		backgroundColor: '#ccc',
		paddingHorizontal: 10,
		paddingVertical: 20
	},
	footer: {
		borderBottomColor: '#999',
		borderBottomWidth: 1,
		backgroundColor: '#fff',
		paddingHorizontal: 10,
		paddingVertical: 20,
		paddingTop: 40
	},
	title: {
		fontSize: 20,
		marginBottom: 20
	},
	subtitle: {
		fontSize: 12,
		marginBottom: 20
	},
	input: {
		height: 50,
		borderBottomWidth: 2,
		borderBottomColor: 'blue',
		marginBottom: 20
	}
});