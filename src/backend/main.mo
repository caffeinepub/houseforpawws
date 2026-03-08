import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";



actor {
  include MixinStorage();

  public type FullUserProfile = {
    displayName : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
    email : Text;
    phone : Text;
  };

  public type PublicUserProfile = {
    displayName : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  public type Pet = {
    id : Text;
    name : Text;
    species : Text;
    breed : Text;
    age : Text;
    size : Text;
    description : Text;
    healthStatus : Text;
    tags : [Text];
    location : Text;
    photoBlobs : [Storage.ExternalBlob];
    isAdopted : Bool;
    ownerId : Principal;
  };

  public type Message = {
    sender : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  public type MessageView = {
    sender : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  public type ConversationView = {
    id : Text;
    user1 : Principal;
    user2 : Principal;
    messages : [MessageView];
  };

  public type PetStore = {
    petIdCounter : Nat;
    pets : Map.Map<Text, Pet>;
  };

  public type Conversation = {
    id : Text;
    user1 : Principal;
    user2 : Principal;
    messages : List.List<Message>;
  };

  module PetStore {
    public func init() : PetStore {
      {
        petIdCounter = 0;
        pets = Map.empty<Text, Pet>();
      };
    };
  };

  module Conversation {
    public func fromView(view : ConversationView) : Conversation {
      {
        id = view.id;
        user1 = view.user1;
        user2 = view.user2;
        messages = List.empty<Message>();
      };
    };

    public func toView(conversation : Conversation) : ConversationView {
      let messagesArr : [MessageView] = conversation.messages.map<Message, MessageView>(
        func(m) { { sender = m.sender; text = m.text; timestamp = m.timestamp } }
      ).toArray();

      {
        id = conversation.id;
        user1 = conversation.user1;
        user2 = conversation.user2;
        messages = messagesArr;
      };
    };

    public func compareByTimestamp(conv1 : Conversation, conv2 : Conversation) : Order.Order {
      let msgs1 = conv1.messages.toArray();
      let msgs2 = conv2.messages.toArray();

      switch (msgs1.size(), msgs2.size()) {
        case (0, 0) { Text.compare(conv1.id, conv2.id) };
        case (0, _) { #less };
        case (_, 0) { #greater };
        case (_) {
          let lastMsg1 = msgs1[msgs1.size() - 1];
          let lastMsg2 = msgs2[msgs2.size() - 1];
          switch (Int.compare(lastMsg1.timestamp, lastMsg2.timestamp)) {
            case (#equal) { Text.compare(conv1.id, conv2.id) };
            case (order) { order };
          };
        };
      };
    };

    public func mergeMessages(existingMessages : List.List<Message>, newMessage : Message) : List.List<Message> {
      let newMessages = List.empty<Message>();
      newMessages.add(newMessage);

      let existingArray = existingMessages.toArray();
      if (existingArray.size() > 0) {
        let lastElement : ?Message = if (existingArray.size() > 0) { ?existingArray[existingArray.size() - 1] } else { null };
        switch (lastElement) {
          case (null) {
            newMessages;
          };
          case (?message) {
            if (message.sender == newMessage.sender and message.text == newMessage.text and message.timestamp == newMessage.timestamp) {
              newMessages;
            } else {
              newMessages.add(message);
              newMessages;
            };
          };
        };
      } else {
        newMessages;
      };
    };
  };

  var petStore = PetStore.init();
  let userProfiles = Map.empty<Principal, FullUserProfile>();
  let conversations = Map.empty<Text, Conversation>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Functions
  public shared ({ caller }) func saveCallerUserProfile(profile : FullUserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?FullUserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    userProfiles.get(caller);
  };

  public type UserProfileResult = {
    #full : FullUserProfile;
    #publicView : PublicUserProfile;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileResult {
    let fullProfile = switch (userProfiles.get(user)) {
      case (null) { return null };
      case (?profile) { profile };
    };

    // Owner or admin can see full profile
    if (caller == user or AccessControl.isAdmin(accessControlState, caller)) {
      ?#full(fullProfile);
    } else {
      // Others see only public fields
      ?#publicView({
        displayName = fullProfile.displayName;
        bio = fullProfile.bio;
        location = fullProfile.location;
        profilePhoto = fullProfile.profilePhoto;
      });
    };
  };

  // Pet Functions
  module Pet {
    public func compare(pet1 : Pet, pet2 : Pet) : Order.Order {
      switch (Text.compare(pet1.id, pet2.id)) {
        case (#equal) { Text.compare(pet1.name, pet2.name) };
        case (order) { order };
      };
    };

    public func compareBySpecies(pet1 : Pet, pet2 : Pet) : Order.Order {
      Text.compare(pet1.species, pet2.species);
    };
  };

  func generatePetId() : Text {
    let id = petStore.petIdCounter.toText();
    petStore := {
      petIdCounter = petStore.petIdCounter + 1;
      pets = petStore.pets;
    };
    id;
  };

  // Pet Management
  public shared ({ caller }) func createPet(pet : Pet) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create pets");
    };

    let petId = generatePetId();
    let newPet : Pet = {
      pet with
      id = petId : Text;
      ownerId = caller;
    };

    petStore.pets.add(petId, newPet);
    petId;
  };

  public shared ({ caller }) func updatePet(petId : Text, updatedPet : Pet) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update pets");
    };

    let existingPet = switch (petStore.pets.get(petId)) {
      case (null) { Runtime.trap("Pet not found") };
      case (?pet) { pet };
    };

    if (existingPet.ownerId != caller) {
      Runtime.trap("Only the owner can update this pet");
    };

    let newPet : Pet = { updatedPet with id = petId : Text };
    petStore.pets.add(petId, newPet);
  };

  public shared ({ caller }) func deletePet(petId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete pets");
    };

    let pet = switch (petStore.pets.get(petId)) {
      case (null) { Runtime.trap("Pet not found") };
      case (?pet) { pet };
    };

    if (pet.ownerId != caller) {
      Runtime.trap("Only the owner can delete this pet");
    };

    petStore.pets.remove(petId);
  };

  // Pet Querying - Public access per spec
  public query ({ caller }) func getPet(petId : Text) : async ?Pet {
    petStore.pets.get(petId);
  };

  public query ({ caller }) func getAllPets() : async [Pet] {
    petStore.pets.values().toArray().sort();
  };

  public query ({ caller }) func getPetsBySpecies(species : Text) : async [Pet] {
    let iter = petStore.pets.values().filter(
      func(pet) {
        Text.equal(pet.species, species);
      }
    );
    iter.toArray();
  };

  public query ({ caller }) func getPetsByLocation(location : Text) : async [Pet] {
    let iter = petStore.pets.values().filter(
      func(pet) {
        Text.equal(pet.location, location);
      }
    );
    iter.toArray();
  };

  public query ({ caller }) func getAdoptedPets(isAdopted : Bool) : async [Pet] {
    let iter = petStore.pets.values().filter(
      func(pet) {
        pet.isAdopted == isAdopted;
      }
    );
    iter.toArray();
  };

  // Conversation ID generation
  func generateConversationId(user1 : Principal, user2 : Principal) : Text {
    if (user1.toText() < user2.toText()) {
      user1.toText() # "-" # user2.toText();
    } else {
      user2.toText() # "-" # user1.toText();
    };
  };

  // Messaging Functions
  public shared ({ caller }) func startOrGetConversation(otherUser : Principal) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start conversations");
    };

    let conversationId = generateConversationId(caller, otherUser);

    if (conversations.containsKey(conversationId)) {
      return conversationId;
    };

    let newConversation : Conversation = {
      id = conversationId;
      user1 = caller;
      user2 = otherUser;
      messages = List.empty<Message>();
    };

    conversations.add(conversationId, newConversation);
    conversationId;
  };

  public shared ({ caller }) func sendMessage(conversationId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };

    if (caller != conversation.user1 and caller != conversation.user2) {
      Runtime.trap("You are not a participant in this conversation");
    };

    let newMessage : Message = {
      sender = caller;
      text;
      timestamp = Time.now();
    };

    conversation.messages.add(newMessage);
  };

  public query ({ caller }) func getMyConversations() : async [ConversationView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let filteredIterations = conversations.values().filter(
      func(conv) {
        conv.user1 == caller or conv.user2 == caller;
      }
    );

    filteredIterations.map<Conversation, ConversationView>(
      func(conv) { Conversation.toView(conv) }
    ).toArray();
  };

  public query ({ caller }) func getMessages(conversationId : Text) : async [MessageView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };

    if (caller != conversation.user1 and caller != conversation.user2) {
      Runtime.trap("You are not a participant in this conversation");
    };

    let messagesIter = conversation.messages.values().map(
      func(m) { { sender = m.sender; text = m.text; timestamp = m.timestamp } }
    );
    messagesIter.toArray();
  };

  public query ({ caller }) func getConversationParticipants(conversationId : Text) : async (Principal, Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversation participants");
    };

    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };

    if (caller != conversation.user1 and caller != conversation.user2) {
      Runtime.trap("You are not a participant in this conversation");
    };

    (conversation.user1, conversation.user2);
  };

  // --- ADMIN FUNCTIONS ---
  public query ({ caller }) func adminGetAllUsers() : async [(Principal, FullUserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get all users");
    };
    userProfiles.toArray();
  };

  public type Stats = {
    totalUsers : Nat;
    totalPets : Nat;
    adoptedPets : Nat;
    totalConversations : Nat;
  };

  public query ({ caller }) func adminGetStats() : async Stats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get stats");
    };

    let petsValues = petStore.pets.values().toArray();
    let adoptedPets = petsValues.filter(
      func(pet) { pet.isAdopted }
    );

    {
      totalUsers = userProfiles.size();
      totalPets = petsValues.size();
      adoptedPets = adoptedPets.size();
      totalConversations = conversations.size();
    };
  };

  public shared ({ caller }) func adminDeletePet(petId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete pets");
    };
    switch (petStore.pets.get(petId)) {
      case (null) { Runtime.trap("Pet not found") };
      case (_) {
        petStore.pets.remove(petId);
      };
    };
  };

  public shared ({ caller }) func adminBanUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };
    AccessControl.assignRole(accessControlState, caller, user, #guest);
  };

  public shared ({ caller }) func adminUnbanUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unban users");
    };
    AccessControl.assignRole(accessControlState, caller, user, #user);
  };

  public query ({ caller }) func adminGetBannedUsers() : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get banned users");
    };

    let allUsers = userProfiles.toArray();
    let bannedUsers = allUsers.filter(
      func((principal, _)) {
        AccessControl.getUserRole(accessControlState, principal) == #guest;
      }
    );

    let bannedPrincipalIter = bannedUsers.map(func((principal, _profile)) { principal });
    bannedPrincipalIter;
  };
};

