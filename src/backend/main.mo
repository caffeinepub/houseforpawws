import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Int "mo:core/Int";
import Prim "mo:prim";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  let ADMIN_TOKEN = "cookiebiscuitoreochickupicku12345";

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
    readBy : List.List<Principal>;
  };

  public type MessageView = {
    sender : Principal;
    text : Text;
    timestamp : Time.Time;
    readBy : [Principal];
  };

  public type ConversationView = {
    id : Text;
    user1 : Principal;
    user2 : Principal;
    messages : [MessageView];
  };

  public type Stats = {
    totalPets : Nat;
    adoptedPets : Nat;
    totalUsers : Nat;
    totalConversations : Nat;
    totalMessages : Nat;
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
    public func toView(conversation : Conversation) : ConversationView {
      let messagesArr : [MessageView] = conversation.messages.map<Message, MessageView>(
        func(m) { { sender = m.sender; text = m.text; timestamp = m.timestamp; readBy = m.readBy.toArray() } }
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
  };

  var petStore = PetStore.init();
  let userProfiles = Map.empty<Principal, FullUserProfile>();
  let conversations = Map.empty<Text, Conversation>();
  let bannedUsers = Set.empty<Principal>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func checkNotBanned(caller : Principal) {
    if (bannedUsers.contains(caller)) {
      Runtime.trap("Unauthorized: User is banned");
    };
  };

  // ── Profile ────────────────────────────────────────────────────────────────

  public shared ({ caller }) func saveCallerUserProfile(profile : FullUserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers cannot save profiles");
    };
    checkNotBanned(caller);
    // Assign user role if not yet assigned
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (?_) {};
    };
    userProfiles.add(caller, profile);
  };

  // Returns null for anonymous or unregistered callers — never traps
  public query ({ caller }) func getCallerUserProfile() : async ?FullUserProfile {
    if (caller.isAnonymous()) return null;
    if (bannedUsers.contains(caller)) return null;
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

    if (caller == user) {
      ?#full(fullProfile);
    } else {
      ?#publicView({
        displayName = fullProfile.displayName;
        bio = fullProfile.bio;
        location = fullProfile.location;
        profilePhoto = fullProfile.profilePhoto;
      });
    };
  };

  // ── Pets ───────────────────────────────────────────────────────────────────

  module Pet {
    public func compare(pet1 : Pet, pet2 : Pet) : Order.Order {
      switch (Text.compare(pet1.id, pet2.id)) {
        case (#equal) { Text.compare(pet1.name, pet2.name) };
        case (order) { order };
      };
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

  public shared ({ caller }) func createPet(pet : Pet) : async Text {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in to create pets");
    checkNotBanned(caller);
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
    if (caller.isAnonymous()) Runtime.trap("Must be logged in to update pets");
    checkNotBanned(caller);
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
    if (caller.isAnonymous()) Runtime.trap("Must be logged in to delete pets");
    checkNotBanned(caller);
    let pet = switch (petStore.pets.get(petId)) {
      case (null) { Runtime.trap("Pet not found") };
      case (?pet) { pet };
    };
    if (pet.ownerId != caller) {
      Runtime.trap("Only the owner can delete this pet");
    };
    petStore.pets.remove(petId);
  };

  public query ({ caller }) func getPet(petId : Text) : async ?Pet {
    petStore.pets.get(petId);
  };

  public query ({ caller }) func getAllPets() : async [Pet] {
    petStore.pets.values().toArray().sort();
  };

  public query ({ caller }) func getPetsBySpecies(species : Text) : async [Pet] {
    petStore.pets.values().filter(func(pet) { Text.equal(pet.species, species) }).toArray();
  };

  public query ({ caller }) func getPetsByLocation(location : Text) : async [Pet] {
    petStore.pets.values().filter(func(pet) { Text.equal(pet.location, location) }).toArray();
  };

  public query ({ caller }) func getAdoptedPets(isAdopted : Bool) : async [Pet] {
    petStore.pets.values().filter(func(pet) { pet.isAdopted == isAdopted }).toArray();
  };

  // ── Conversations ──────────────────────────────────────────────────────────

  func generateConversationId(user1 : Principal, user2 : Principal) : Text {
    if (user1.toText() < user2.toText()) {
      user1.toText() # "-" # user2.toText();
    } else {
      user2.toText() # "-" # user1.toText();
    };
  };

  public shared ({ caller }) func startOrGetConversation(otherUser : Principal) : async Text {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    checkNotBanned(caller);
    let conversationId = generateConversationId(caller, otherUser);
    if (conversations.containsKey(conversationId)) return conversationId;
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
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    checkNotBanned(caller);
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
      readBy = List.empty<Principal>();
    };
    conversation.messages.add(newMessage);
  };

  public query ({ caller }) func getMyConversations() : async [ConversationView] {
    if (caller.isAnonymous()) return [];
    if (bannedUsers.contains(caller)) return [];
    conversations.values().filter(
      func(conv) { conv.user1 == caller or conv.user2 == caller }
    ).map<Conversation, ConversationView>(
      func(conv) { Conversation.toView(conv) }
    ).toArray();
  };

  public query ({ caller }) func getMessages(conversationId : Text) : async [MessageView] {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    checkNotBanned(caller);
    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };
    if (caller != conversation.user1 and caller != conversation.user2) {
      Runtime.trap("You are not a participant in this conversation");
    };
    conversation.messages.values().map(
      func(m) {{
        sender = m.sender;
        text = m.text;
        timestamp = m.timestamp;
        readBy = m.readBy.toArray();
      }}
    ).toArray();
  };

  public query ({ caller }) func getConversationParticipants(conversationId : Text) : async (Principal, Principal) {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    checkNotBanned(caller);
    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };
    if (caller != conversation.user1 and caller != conversation.user2) {
      Runtime.trap("You are not a participant in this conversation");
    };
    (conversation.user1, conversation.user2);
  };

  public shared ({ caller }) func markConversationRead(conversationId : Text) : async () {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    checkNotBanned(caller);
    let conversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };
    if (caller != conversation.user1 and caller != conversation.user2) {
      Runtime.trap("You are not a participant in this conversation");
    };
    let updatedMessages = List.empty<Message>();
    for (message in conversation.messages.values()) {
      let hasRead = not message.readBy.filter(func(p) { p == caller }).toArray().isEmpty();
      if (message.sender != caller and not hasRead) {
        let updatedReadBy = List.empty<Principal>();
        for (principal in message.readBy.values()) { updatedReadBy.add(principal) };
        updatedReadBy.add(caller);
        updatedMessages.add({
          sender = message.sender;
          text = message.text;
          timestamp = message.timestamp;
          readBy = updatedReadBy;
        });
      } else {
        updatedMessages.add(message);
      };
    };
    conversations.add(conversationId, {
      id = conversation.id;
      user1 = conversation.user1;
      user2 = conversation.user2;
      messages = updatedMessages;
    });
  };

  // ── Admin ──────────────────────────────────────────────────────────────────

  // Call this with the correct token to gain permanent admin role
  public shared ({ caller }) func claimAdminWithToken(token : Text) : async Bool {
    if (caller.isAnonymous()) return false;
    if (token != ADMIN_TOKEN) return false;
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    true;
  };


  public query ({ caller }) func adminGetStats() : async Stats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access stats");
    };
    let totalPets = petStore.pets.size();
    let adoptedPets = petStore.pets.values().toArray().filter(func(pet) { pet.isAdopted }).size();
    let totalUsers = userProfiles.size();
    let totalConversations = conversations.size();
    let totalMessages = conversations.values().foldLeft(
      0,
      func(acc, conv) { acc + conv.messages.size() },
    );
    { totalPets; adoptedPets; totalUsers; totalConversations; totalMessages };
  };

  public query ({ caller }) func adminGetAllUsers() : async [(Principal, FullUserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access all users");
    };
    userProfiles.toArray();
  };

  public shared ({ caller }) func adminDeletePet(petId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete pets");
    };
    if (not petStore.pets.containsKey(petId)) Runtime.trap("Pet not found");
    petStore.pets.remove(petId);
  };

  public shared ({ caller }) func adminBanUser(user : Principal) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };
    if (bannedUsers.contains(user)) return false;
    bannedUsers.add(user);
    true;
  };

  public shared ({ caller }) func adminUnbanUser(user : Principal) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can unban users");
    };
    if (not bannedUsers.contains(user)) return false;
    bannedUsers.remove(user);
    true;
  };

  public query ({ caller }) func adminGetBannedUsers() : async [Principal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view banned users");
    };
    bannedUsers.toArray();
  };

  public query ({ caller }) func isCallerBanned() : async Bool {
    bannedUsers.contains(caller);
  };
};
